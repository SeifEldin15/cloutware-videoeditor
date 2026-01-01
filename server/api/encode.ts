import { z } from 'zod'
import { PassThrough } from 'stream'
import { readValidatedBody, getValidatedQuery, setResponseHeader } from 'h3'
import { createClient } from '@supabase/supabase-js'
import { submitGpuEncodeJob } from '../utils/batch-gpu'
import { ValidationSchemas } from '../utils/validation-schemas'

// Check if we should use GPU batch processing
const USE_GPU_BATCH = process.env.USE_GPU_BATCH === 'true' || process.env.USE_GPU === 'true'

export default defineEventHandler(async (event) => {
  try {
    const query = await getValidatedQuery(event, ValidationSchemas.querySchema.parse)
    const body = await readValidatedBody(event, ValidationSchemas.bodySchema.parse)
    
    const format = query.format || body.format
    const { url, outputName, options } = body
    const caption = body.caption as any // Allow dynamic properties like textReplacements
    
    console.log(`Processing video: ${url}, format: ${format}, GPU Batch: ${USE_GPU_BATCH}`)
    
    // Validate format constraints
    if (format !== 'mp4' && caption?.srtContent) {
      throw new Error('Captions can only be applied to MP4 format videos')
    }
    
    if (format !== 'mp4' && caption?.textReplacements?.length) {
      throw new Error('Text replacements can only be applied to MP4 format videos')
    }
    
    // Validate URL accessibility
    await validateVideoUrl(url)
    
    // ============================================================
    // GPU BATCH MODE: Submit to AWS Batch and return result from Supabase
    // ============================================================
    if (USE_GPU_BATCH) {
      console.log('🚀 Using GPU Batch mode for encoding...')
      
      const batchResult = await submitGpuEncodeJob({
        url,
        outputName,
        format,
        options,
        caption
      })
      
      if (!batchResult.success || !batchResult.outputPath) {
        throw new Error(`GPU Batch job failed: ${batchResult.error || 'Unknown error'}`)
      }
      
      // Download the processed video from Supabase
      const supabaseUrl = process.env.SUPABASE_URL || ''
      const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY || ''
      const supabase = createClient(supabaseUrl, supabaseKey)
      
      const { data, error } = await supabase.storage
        .from('videos')
        .download(batchResult.outputPath)
      
      if (error || !data) {
        throw new Error(`Failed to download processed video: ${error?.message || 'No data'}`)
      }
      
      const buffer = Buffer.from(await data.arrayBuffer())
      
      console.log(`✅ GPU Batch complete, returning ${buffer.length} bytes`)
      
      setResponseHeader(event, 'Content-Type', 'video/mp4')
      setResponseHeader(event, 'Content-Disposition', `attachment; filename="${outputName}.mp4"`)
      
      return buffer
    }
    
    // ============================================================
    // LOCAL CPU MODE: Process video locally (fallback)
    // ============================================================
    console.log('⚙️ Using local CPU mode for encoding...')
    
    // Dynamic imports for local processing (only when needed)
    const { VideoProcessor } = await import('../utils/video-processor')
    const { SubtitleProcessor } = await import('../utils/subtitle-processor')
    const { TextReplacementProcessor } = await import('../utils/text-replacement-processor')
    
    let videoStream: PassThrough
    
    if (format === 'mp4' && caption?.textReplacements?.length) {
      console.log(`Processing with ${caption.textReplacements.length} text replacement(s)`)
      videoStream = await TextReplacementProcessor.process(url, caption.textReplacements, options, outputName)
    } else if (format === 'mp4' && caption?.srtContent) {
      videoStream = await processVideoWithSubtitles(url, caption, options, SubtitleProcessor)
    } else {
      videoStream = await VideoProcessor.process(url, format, options, outputName)
    }
    
    const contentType = getContentTypeForFormat(format)
    const fileExtension = getFileExtensionForFormat(format)
    
    setResponseHeader(event, 'Content-Type', contentType)
    setResponseHeader(event, 'Content-Disposition', `attachment; filename="${outputName}.${fileExtension}"`)
    
    return videoStream
    
  } catch (error) {
    console.error('Error processing video:', error)
    event.node.res.statusCode = 500
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    return { error: 'Failed to process video: ' + errorMessage }
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

async function processVideoWithSubtitles(
  url: string, 
  caption: any, 
  options: any,
  SubtitleProcessor: any
): Promise<PassThrough> {
  if (caption.wordMode && caption.wordMode !== 'normal') {
    console.log(`Word mode: ${caption.wordMode} with ${caption.wordsPerGroup || 1} words per group`)
  }
  
  if (caption.subtitleStyle && caption.subtitleStyle !== 'basic') {
    console.log(`Using ${caption.subtitleStyle} style subtitles with advanced processing`)
    return SubtitleProcessor.processAdvanced(url, caption, options)
  } else {
    console.log('Using basic subtitle processing')
    return SubtitleProcessor.processBasic(url, caption)
  }
}

function getContentTypeForFormat(format: string): string {
  const contentTypes = {
    'mp4': 'video/mp4',
    'gif': 'image/gif',
    'png': 'image/png'
  }
  return contentTypes[format as keyof typeof contentTypes] || 'video/mp4'
}

function getFileExtensionForFormat(format: string): string {
  const extensions = {
    'mp4': 'mp4',
    'gif': 'gif', 
    'png': 'png'
  }
  return extensions[format as keyof typeof extensions] || 'mp4'
}