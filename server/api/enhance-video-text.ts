import { readBody, setResponseHeader } from 'h3'
import { detectTextWithCoordinates } from '../utils/text-detection-coords'
import { replaceTextInVideo, createReplacementsFromDetections } from '../utils/video-text-replacer'
import { z } from 'zod'

const enhanceVideoTextSchema = z.object({
  url: z.string().url(),
  outputName: z.string().optional().default('enhanced_video'),
  detectionOptions: z.object({
    numberOfFrames: z.number().min(1).max(200).optional().default(100),  // Scan entire video
    confidenceThreshold: z.number().min(0).max(100).optional().default(70),
    language: z.string().optional().default('eng')
  }).optional().default({}),
  styleOptions: z.object({
    fontFamily: z.string().optional().default('Arial'),
    fontSize: z.number().optional().default(36),
    fontColor: z.string().optional().default('#000000'), // Black text
    backgroundColor: z.string().optional().default('#FFFFFF'), // White background
    backgroundOpacity: z.number().min(0).max(1).optional().default(0.95)
  }).optional().default({})
})

export default eventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const validated = enhanceVideoTextSchema.parse(body)
    
    const { url, outputName, detectionOptions, styleOptions } = validated
    
    console.log(`📹 Enhancing video text: ${url}`)
    console.log(`🔍 AUTO-DETECTING all text in video (no user input needed)...`)
    
    // Step 1: Automatically detect ALL text in the video
    const detectionResult = await detectTextWithCoordinates(url, detectionOptions)
    
    if (detectionResult.detectedTexts.length === 0) {
      return {
        success: false,
        error: 'No text detected in video. Nothing to enhance.'
      }
    }
    
    console.log(`✅ Auto-detected ${detectionResult.detectedTexts.length} text region(s):`)
    detectionResult.detectedTexts.forEach((d, i) => {
      const timeRange = d.startTime !== undefined && d.endTime !== undefined 
        ? ` at ${d.startTime.toFixed(2)}s-${d.endTime.toFixed(2)}s`
        : ''
      console.log(`   ${i + 1}. "${d.text}" (${d.confidence.toFixed(1)}% confidence)${timeRange}`)
    })
    
    // Step 2: Create replacements for EACH detection (even duplicates at different times)
    console.log(`\n🎨 Creating ${detectionResult.detectedTexts.length} white overlays with text re-rendered in black...`)
    
    // Create a replacement for EACH detected text occurrence
    // Don't use a Map because we want to keep duplicates at different times
    const textReplacements = detectionResult.detectedTexts.map((detected, i) => {
      console.log(`   ${i + 1}. Will overlay: "${detected.text}" at ${detected.startTime?.toFixed(2)}s-${detected.endTime?.toFixed(2)}s`)
      return {
        originalText: detected.text,
        newText: detected.text,  // Use the SAME text - just enhancing visibility
        boundingBox: detected.boundingBox,
        timestamp: detected.timestamp,
        startTime: detected.startTime,
        endTime: detected.endTime
      }
    })
    
    console.log(`\n🎬 Applying ${textReplacements.length} text enhancement(s) with time-based overlays...`)
    
    // Step 3: Generate video with white overlays and black text (horizontally aligned)
    const videoStream = await replaceTextInVideo(url, {
      textReplacements,
      outputName,
      videoWidth: detectionResult.videoWidth,  // Pass video width for horizontal alignment
      ...styleOptions
    })
    
    console.log('✅ Video stream created with enhanced text')
    
    let streamHasData = false
    videoStream.on('data', () => {
      streamHasData = true
    })
    
    videoStream.on('end', () => {
      if (!streamHasData) {
        console.error('⚠️ WARNING: Video stream ended without any data!')
      } else {
        console.log('✅ Video stream ended successfully with enhanced text')
      }
    })
    
    setResponseHeader(event, 'Content-Type', 'video/mp4')
    setResponseHeader(event, 'Content-Disposition', `attachment; filename="${outputName}.mp4"`)
    
    console.log('📤 Returning enhanced video stream...')
    return videoStream
    
  } catch (error) {
    console.error('❌ Video text enhancement error:', error)
    event.node.res.statusCode = 500
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    return {
      success: false,
      error: 'Failed to enhance video text: ' + errorMessage
    }
  }
})
