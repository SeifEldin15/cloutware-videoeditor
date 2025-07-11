import { readValidatedBody, setResponseHeader } from 'h3'
import { TextReplacementProcessor } from '../utils/text-replacement-processor'
import { TextReplacementSchemas } from '../utils/validation-schemas'

export default eventHandler(async (event) => {
  try {
    const body = await readValidatedBody(event, TextReplacementSchemas.textReplacementSchema.parse)
    
    const { url, outputName, textReplacements, options } = body
    
    console.log(`Processing video for text replacement: ${url}`)
    console.log(`Text replacements requested: ${textReplacements.length}`)
    
    await validateVideoUrl(url)
    
    const videoStream = await TextReplacementProcessor.process(
      url, 
      textReplacements, 
      options, 
      outputName
    )
    
    setResponseHeader(event, 'Content-Type', 'video/mp4')
    setResponseHeader(event, 'Content-Disposition', `attachment; filename="${outputName || 'text_replaced_video'}.mp4"`)
    
    return videoStream
    
  } catch (error) {
    console.error('Error processing video with text replacement:', error)
    event.node.res.statusCode = 500
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    return { error: 'Failed to process video with text replacement: ' + errorMessage }
  }
})

async function validateVideoUrl(url: string): Promise<void> {
  try {
    const headResponse = await fetch(url, { method: 'HEAD' })
    if (!headResponse.ok) {
      throw new Error(`Video URL not accessible: ${headResponse.status} ${headResponse.statusText}`)
    }
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Cannot access video URL: ${error.message}`)
    }
    throw new Error('Cannot access video URL: Unknown error')
  }
} 