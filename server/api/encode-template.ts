import { z } from 'zod'
import { PassThrough } from 'stream'
import { readValidatedBody, getValidatedQuery, setResponseHeader } from 'h3'
import { VideoProcessor } from '../utils/video-processor'
import { SubtitleProcessor } from '../utils/subtitle-processor'
import { applyTemplate, getStyleTemplate, listAvailableTemplates, styleTemplates } from '../utils/style-templates'

// Validation schema for template-based requests
const templateRequestSchema = z.object({
  url: z.string().url('Invalid video URL'),
  srtContent: z.string().min(1, 'SRT content is required'),
  templateName: z.string().min(1, 'Template name is required'),
  outputName: z.string().regex(/^[a-zA-Z0-9_-]+$/, 'Output name can only contain letters, numbers, underscores and hyphens').optional().default('template_video'),
  format: z.enum(['mp4']).optional().default('mp4'), // Only MP4 supported for captions
  options: z.object({
    quality: z.enum(['low', 'medium', 'high']).optional().default('medium'),
    audioBitrate: z.string().regex(/^\d+k$/).optional().default('192k'),
    speedFactor: z.number().min(0.5).max(2).optional(),
    zoomFactor: z.number().min(1).max(2).optional(),
    saturationFactor: z.number().min(0.5).max(2).optional(),
    framerate: z.number().optional(),
    lightness: z.number().min(-0.5).max(0.5).optional(),
    resolution: z.string().optional(),
    audioPitch: z.number().min(0.5).max(1.5).optional(),
    backgroundAudio: z.boolean().optional().default(false),
    backgroundAudioVolume: z.number().min(0.05).max(0.5).optional().default(0.2),
    smartCrop: z.object({
      percentage: z.number().min(0.1).max(2).optional(),
      direction: z.enum(['center', 'top', 'bottom', 'left', 'right', 'random']).optional()
    }).optional(),
    temporalModification: z.object({
      dropFrames: z.number().min(0).max(10).optional(),
      duplicateFrames: z.number().min(0).max(10).optional(),
      reverseSegments: z.boolean().optional()
    }).optional(),
    audioTempoMod: z.object({
      tempoFactor: z.number().min(0.8).max(1.2).optional(),
      preservePitch: z.boolean().optional()
    }).optional(),
    syncShift: z.number().min(-500).max(500).optional(),
    eqAdjustments: z.object({
      low: z.number().min(-5).max(5).optional(),
      mid: z.number().min(-5).max(5).optional(),
      high: z.number().min(-5).max(5).optional()
    }).optional(),
    reverbEffect: z.object({
      level: z.number().min(0.05).max(0.2).optional(),
      delay: z.number().min(20).max(100).optional()
    }).optional(),
    backgroundAddition: z.object({
      type: z.enum(['room', 'crowd', 'nature', 'white_noise']).optional(),
      level: z.number().min(0.01).max(0.1).optional()
    }).optional(),
    metadata: z.record(z.string()).optional(),
    visibleChanges: z.object({
      horizontalFlip: z.boolean().optional().default(false),
      border: z.boolean().optional().default(false),
      timestamp: z.boolean().optional().default(false)
    }).optional().default({}),
    antiDetection: z.object({
      pixelShift: z.boolean().optional().default(true),
      microCrop: z.boolean().optional().default(true),
      subtleRotation: z.boolean().optional().default(true),
      noiseAddition: z.boolean().optional().default(true),
      metadataPoisoning: z.boolean().optional().default(true),
      frameInterpolation: z.boolean().optional().default(true)
    }).optional().default({}),
    verticalPosition: z.number().min(0).max(100).optional()
  }).optional().default({})
})

export default eventHandler(async (event) => {
  try {
    const method = event.node.req.method
    
    // Handle GET requests - return available templates
    if (method === 'GET') {
      const templates = listAvailableTemplates()
      return {
        success: true,
        message: 'Available style templates',
        templates: templates.map(template => ({
          name: template.name,
          key: template.name.toLowerCase().replace(/\s+/g, '').replace('&', ''),
          description: template.description,
          fontFamily: template.fontFamily
        }))
      }
    }
    
    // Handle POST requests - process video with template
    if (method !== 'POST') {
      throw new Error('Only GET and POST methods are supported')
    }
    
    const body = await readValidatedBody(event, templateRequestSchema.parse)
    const { url, srtContent, templateName, outputName, format, options } = body
    
    console.log(`🎬 Processing video with template: ${templateName}`)
    console.log(`📹 Video URL: ${url}`)
    console.log(`📝 SRT length: ${srtContent.length} characters`)
    console.log(`📊 Request body:`, JSON.stringify(body, null, 2))
    
    // Get the template configuration
    const template = getStyleTemplate(templateName)
    if (!template) {
      const availableTemplates = Object.keys(styleTemplates)
      console.error(`❌ Template '${templateName}' not found. Available: ${availableTemplates.join(', ')}`)
      throw new Error(`Template '${templateName}' not found. Available templates: ${availableTemplates.join(', ')}`)
    }
    
    console.log(`✅ Template found: ${template.name} - ${template.description}`)
    
    // Apply template configuration with user options
    const userOptions: any = { srtContent }
    
    // Only override verticalPosition if user provided one
    if (options.verticalPosition !== undefined) {
      userOptions.verticalPosition = options.verticalPosition
      console.log(`🎯 User specified vertical position: ${options.verticalPosition}`)
    } else {
      console.log(`📍 Using template default vertical position`)
    }
    
    const captionConfig = applyTemplate(templateName, userOptions)
    
    console.log(`Applied template: ${template.name} (${template.description})`)
    console.log(`Font: ${template.fontFamily}`)
    console.log(`Vertical Position: ${options.verticalPosition !== undefined ? options.verticalPosition + ' (user)' : 'template default'}`)
    
    // Validate URL accessibility
    await validateVideoUrl(url)
    
    // Process video with template-based subtitles
    console.log('🚀 Starting SubtitleProcessor.processAdvanced()...')
    const videoStream = await SubtitleProcessor.processAdvanced(url, captionConfig, options)
    console.log('✅ SubtitleProcessor.processAdvanced() completed, got stream')
    
    // Set response headers
    setResponseHeader(event, 'Content-Type', 'video/mp4')
    setResponseHeader(event, 'Content-Disposition', `attachment; filename="${outputName}.mp4"`)
    console.log(`📤 Response headers set for: ${outputName}.mp4`)
    
    // Monitor the stream being returned
    let responseBytes = 0
    videoStream.on('data', (chunk) => {
      responseBytes += chunk.length
    })
    
    videoStream.on('end', () => {
      console.log(`🎯 Response stream ended. Total sent: ${(responseBytes / 1024 / 1024).toFixed(2)}MB`)
      if (responseBytes === 0) {
        console.error('🚨 CRITICAL: Response stream was empty (0 bytes)!')
      }
    })
    
    videoStream.on('error', (streamError) => {
      console.error('🚨 Response stream error:', streamError)
    })
    
    console.log('📤 Returning video stream to client')
    return videoStream
    
  } catch (error) {
    console.error('Error processing video with template:', error)
    event.node.res.statusCode = 500
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    return { 
      success: false,
      error: 'Failed to process video with template: ' + errorMessage 
    }
  }
})

async function validateVideoUrl(url: string): Promise<void> {
  try {
    const headResponse = await fetch(url, { method: 'HEAD' })
    if (!headResponse.ok) {
      throw new Error(`Video URL not accessible: ${url}`)
    }
  } catch (error: any) {
    throw new Error(`Cannot access video URL: ${url}`)
  }
} 