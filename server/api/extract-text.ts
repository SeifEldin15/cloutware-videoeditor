import { readBody } from 'h3'
import { extractTextFromVideo } from '../utils/ocr-processor'
import { OCRSchemas } from '../utils/validation-schemas'

export default eventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const { url, numberOfFrames, language, confidenceThreshold } = OCRSchemas.extractTextSchema.parse(body)
    
    console.log(`📹 Processing OCR for video: ${url}`)
    
    // Validate URL accessibility
    try {
      const headResponse = await fetch(url, { method: 'HEAD' })
      if (!headResponse.ok) {
        throw new Error(`Video URL not accessible: ${headResponse.status}`)
      }
    } catch (error: any) {
      throw new Error(`Cannot access video URL: ${error.message}`)
    }
    
    // Extract text from video
    const result = await extractTextFromVideo(url, {
      numberOfFrames,
      language,
      confidenceThreshold
    })
    
    console.log(`✅ OCR complete. Extracted ${result.text.length} characters from ${result.frameResults.length} frames`)
    
    return {
      success: true,
      data: {
        text: result.text,
        confidence: result.confidence,
        totalFrames: numberOfFrames,
        framesWithText: result.frameResults.length,
        frameResults: result.frameResults
      }
    }
    
  } catch (error) {
    console.error('❌ OCR extraction error:', error)
    event.node.res.statusCode = 500
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    return {
      success: false,
      error: 'Failed to extract text from video: ' + errorMessage
    }
  }
})
