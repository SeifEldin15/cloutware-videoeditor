import { readBody, setResponseHeader } from 'h3'
import { generateOcrNarration } from '../utils/ocr-narration'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    
    // Basic validation
    if (!body.url) throw new Error('URL is required')
    
    const { url, options = {} } = body
    
    console.log(`🎙️ Processing video for OCR narration: ${url}`)
    
    // Step 1: Generate narration video (returns buffer)
    const narratedBuffer = await generateOcrNarration(
        url,
        {
            numberOfFrames: options.numberOfFrames || 100,
            confidenceThreshold: options.confidenceThreshold || 79,
            voice: options.voice || '21m00Tcm4TlvDq8ikWAM',
            timedNarration: options.timedNarration !== false,
        }
    )
    
    if (!narratedBuffer || narratedBuffer.length === 0) {
        return {
            success: false,
            message: 'No narration generated (possibly no text detected)'
        }
    }
    
    console.log(`✅ Narration generated, buffer size: ${narratedBuffer.length}`)

    // Set headers for file download
    setResponseHeader(event, 'Content-Type', 'video/mp4')
    setResponseHeader(event, 'Content-Disposition', `attachment; filename="narrated_video.mp4"`)
    
    // Return buffer directly
    return narratedBuffer
    
  } catch (error) {
    console.error('❌ OCR narration error:', error)
    event.node.res.statusCode = 500
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    return {
      success: false,
      error: 'Failed to generate OCR narration: ' + errorMessage
    }
  }
})
