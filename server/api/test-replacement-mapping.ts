import { readBody } from 'h3'
import { detectTextWithCoordinates } from '../utils/text-detection-coords'
import { createReplacementsFromDetections } from '../utils/video-text-replacer'

export default eventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const { url, replacements } = body
    
    console.log('🔬 Testing detection and replacement mapping...')
    
    // Step 1: Detect text
    const detectionResult = await detectTextWithCoordinates(url, {
      numberOfFrames: 5,
      confidenceThreshold: 50,
      language: 'eng'
    })
    
    console.log(`Found ${detectionResult.detectedTexts.length} text regions`)
    
    // Step 2: Create replacement map
    const replacementMap = new Map<string, string>()
    for (const [oldText, newText] of Object.entries(replacements)) {
      const detected = detectionResult.detectedTexts.find(d => 
        d.text.toLowerCase().includes(oldText.toLowerCase()) ||
        oldText.toLowerCase().includes(d.text.toLowerCase())
      )
      
      if (detected) {
        replacementMap.set(detected.text, newText)
        console.log(`📝 Match: "${detected.text}" -> "${newText}"`)
      } else {
        console.warn(`⚠️ No match for "${oldText}"`)
      }
    }
    
    // Step 3: Create replacements
    const textReplacements = createReplacementsFromDetections(
      detectionResult.detectedTexts,
      replacementMap
    )
    
    console.log(`Created ${textReplacements.length} replacements`)
    
    return {
      success: true,
      detectedCount: detectionResult.detectedTexts.length,
      matchedCount: replacementMap.size,
      replacementCount: textReplacements.length,
      detectedTexts: detectionResult.detectedTexts.map(d => d.text),
      matches: Array.from(replacementMap.entries()).map(([old, newText]) => ({ old, new: newText })),
      replacements: textReplacements
    }
    
  } catch (error) {
    console.error('Test error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
})
