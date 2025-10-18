import { readBody, setResponseHeader } from 'h3'
import { detectTextWithCoordinates } from '../utils/text-detection-coords'
import { replaceTextInVideo, createReplacementsFromDetections } from '../utils/video-text-replacer'
import { VideoTextReplacementSchemas } from '../utils/validation-schemas'

export default eventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const validated = VideoTextReplacementSchemas.replaceVideoTextSchema.parse(body)
    
    const { url, outputName, replacements, detectionOptions, styleOptions } = validated
    
    console.log(`📹 Processing video for text replacement: ${url}`)
    console.log(`🔍 Detecting text in video...`)
    
    // Step 1: Detect text with coordinates
    const detectionResult = await detectTextWithCoordinates(url, detectionOptions)
    
    if (detectionResult.detectedTexts.length === 0) {
      return {
        success: false,
        error: 'No text detected in video. Cannot perform replacements.'
      }
    }
    
    console.log(`✅ Found ${detectionResult.detectedTexts.length} text region(s)`)
    
    // Step 2: Create replacement map
    const replacementMap = new Map<string, string>()
    for (const [oldText, newText] of Object.entries(replacements)) {
      // Try to find matching detected text (case-insensitive, partial match)
      const detected = detectionResult.detectedTexts.find(d => 
        d.text.toLowerCase().includes(oldText.toLowerCase()) ||
        oldText.toLowerCase().includes(d.text.toLowerCase())
      )
      
      if (detected) {
        replacementMap.set(detected.text, newText)
        console.log(`📝 Will replace "${detected.text}" with "${newText}"`)
      } else {
        console.warn(`⚠️  Could not find "${oldText}" in video`)
      }
    }
    
    if (replacementMap.size === 0) {
      return {
        success: false,
        error: 'None of the specified texts were found in the video.',
        detectedTexts: detectionResult.detectedTexts.map(d => d.text)
      }
    }
    
    // Step 3: Create text replacements from detections
    const textReplacements = createReplacementsFromDetections(
      detectionResult.detectedTexts,
      replacementMap
    )
    
    console.log(`🎨 Applying ${textReplacements.length} replacement(s)...`)
    
    // Step 4: Replace text in video
    const videoStream = await replaceTextInVideo(url, {
      textReplacements,
      outputName,
      ...styleOptions
    })
    
    setResponseHeader(event, 'Content-Type', 'video/mp4')
    setResponseHeader(event, 'Content-Disposition', `attachment; filename="${outputName}.mp4"`)
    
    return videoStream
    
  } catch (error) {
    console.error('❌ Video text replacement error:', error)
    event.node.res.statusCode = 500
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    return {
      success: false,
      error: 'Failed to replace text in video: ' + errorMessage
    }
  }
})
