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
    console.log(`🔍 Detecting text in video dynamically...`)
    
    // Step 1: Detect text with coordinates (DYNAMIC - no hardcoding)
    const detectionResult = await detectTextWithCoordinates(url, detectionOptions)
    
    if (detectionResult.detectedTexts.length === 0) {
      return {
        success: false,
        error: 'No text detected in video. Cannot perform replacements.'
      }
    }
    
    console.log(`✅ Dynamically detected ${detectionResult.detectedTexts.length} text region(s):`)
    detectionResult.detectedTexts.forEach((d, i) => {
      console.log(`   ${i + 1}. "${d.text}" (${d.confidence.toFixed(1)}% confidence)`)
    })
    
    // Step 2: DYNAMIC MATCHING - Match user search terms to detected text
    console.log(`\n🔍 Matching your search terms to detected text...`)
    const replacementMap = new Map<string, string>()
    const usedDetections = new Set<string>() // Track which detections we've already matched
    
    for (const [searchTerm, replacementText] of Object.entries(replacements)) {
      // Find best matching detected text (case-insensitive, must contain the search term)
      // Sort by confidence to prioritize high-quality matches
      const matches = detectionResult.detectedTexts
        .filter(d => !usedDetections.has(d.text)) // Don't reuse detections
        .filter(d => d.text.toLowerCase().includes(searchTerm.toLowerCase()))
        .sort((a, b) => b.confidence - a.confidence) // Highest confidence first
      
      if (matches.length > 0) {
        const detected = matches[0]
        replacementMap.set(detected.text, replacementText)
        usedDetections.add(detected.text)
        console.log(`✅ MATCH: Search term "${searchTerm}"`)
        console.log(`   Found in: "${detected.text}" (${detected.confidence.toFixed(1)}%)`)
        console.log(`   Will replace ENTIRE line with: "${replacementText}"`)
      } else {
        console.warn(`⚠️  NO MATCH: Search term "${searchTerm}" not found in any detected text`)
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
    console.log('📊 Replacement details:', JSON.stringify(textReplacements, null, 2))
    
    // Step 4: Replace text in video
    console.log('🎬 Starting video text replacement...')
    const videoStream = await replaceTextInVideo(url, {
      textReplacements,
      outputName,
      ...styleOptions
    })
    
    console.log('✅ Video stream created, setting response headers...')
    
    // Track if stream actually has data
    let streamHasData = false
    videoStream.on('data', () => {
      streamHasData = true
    })
    
    videoStream.on('end', () => {
      if (!streamHasData) {
        console.error('⚠️ WARNING: Video stream ended without any data!')
      } else {
        console.log('✅ Video stream ended successfully with data')
      }
    })
    
    setResponseHeader(event, 'Content-Type', 'video/mp4')
    setResponseHeader(event, 'Content-Disposition', `attachment; filename="${outputName}.mp4"`)
    
    console.log('📤 Returning video stream to client...')
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
