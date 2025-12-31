import { readBody } from 'h3'
import { detectTextWithCoordinates } from '../utils/text-detection-coords'

export default eventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const { url, numberOfFrames = 3, confidenceThreshold = 40, language = 'eng' } = body
    
    console.log('🔍 Starting text detection test...')
    console.log(`Settings: ${numberOfFrames} frames, ${confidenceThreshold}% threshold`)
    
    const result = await detectTextWithCoordinates(url, {
      numberOfFrames,
      confidenceThreshold,
      language
    })
    
    return {
      success: true,
      result
    }
  } catch (error) {
    console.error('❌ Test error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
})
