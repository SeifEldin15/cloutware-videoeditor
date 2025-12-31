import { readBody, setResponseHeader } from 'h3'
import { detectTextWithCoordinates } from '../utils/text-detection-coords'
import { replaceTextInVideo } from '../utils/video-text-replacer'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    
    // Basic validation
    if (!body.url) throw new Error('URL is required')
    
    const { url, outputName, detectionOptions = {}, styleOptions = {} } = body
    
    console.log(`📹 Processing video for OCR overlay: ${url}`)
    console.log(`🔍 Detecting text in video...`)
    
    // Step 1: Detect text
    const detectionResult = await detectTextWithCoordinates(url, {
        numberOfFrames: detectionOptions.numberOfFrames || 100,
        confidenceThreshold: detectionOptions.confidenceThreshold || 79,
        language: 'eng'
    })
    
    if (detectionResult.detectedTexts.length === 0) {
      return {
        success: false,
        noTextDetected: true,
        message: 'No text detected in video.'
      }
    }
    
    console.log(`✅ Detected ${detectionResult.detectedTexts.length} text region(s)`)
    
    // Step 2: Map all text to itself for overlay (clean redraw)
    const textReplacements = detectionResult.detectedTexts.map((detected: any) => ({
        originalText: detected.text,
        newText: detected.text, // Replace with itself to just "clean up" the text look
        boundingBox: detected.boundingBox,
        timestamp: detected.timestamp,
        startTime: detected.startTime,
        endTime: detected.endTime
    }))
    
    console.log(`🎨 Applying text overlays...`)
    
    // Step 3: Replace/Overlay text in video
    const videoStream = await replaceTextInVideo(url, {
      textReplacements,
      outputName: outputName || 'ocr_overlay_video',
      videoWidth: detectionResult.videoWidth,
      fontFamily: styleOptions.fontFamily || 'Arial',
      fontSize: styleOptions.fontSize || 48,
      fontColor: styleOptions.fontColor || '#000000',
      backgroundColor: styleOptions.backgroundColor || '#FFFFFF',
      backgroundOpacity: styleOptions.backgroundOpacity ?? 1.0
    })
    
    // Set headers for file download
    setResponseHeader(event, 'Content-Type', 'video/mp4')
    setResponseHeader(event, 'Content-Disposition', `attachment; filename="${outputName || 'video'}.mp4"`)
    
    return videoStream
    
  } catch (error) {
    console.error('❌ OCR overlay error:', error)
    event.node.res.statusCode = 500
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    return {
      success: false,
      error: 'Failed to apply OCR overlay: ' + errorMessage
    }
  }
})
