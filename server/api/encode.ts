import { z } from 'zod'
import { PassThrough } from 'stream'
import { readValidatedBody, getValidatedQuery, setResponseHeader } from 'h3'
import { VideoProcessor } from '../utils/video-processor'
import { SubtitleProcessor } from '../utils/subtitle-processor'
import { TextReplacementProcessor } from '../utils/text-replacement-processor'
import { ValidationSchemas } from '../utils/validation-schemas'

export default eventHandler(async (event) => {
  try {
    const query = await getValidatedQuery(event, ValidationSchemas.querySchema.parse)
    const body = await readValidatedBody(event, ValidationSchemas.bodySchema.parse)
    
    const format = query.format || body.format
    const { url, outputName, options, caption } = body
    
    console.log(`Processing video: ${url}, format: ${format}`)
    
    // Validate format constraints
    if (format !== 'mp4' && caption?.srtContent) {
      throw new Error('Captions can only be applied to MP4 format videos')
    }
    
    if (format !== 'mp4' && caption?.textReplacements?.length) {
      throw new Error('Text replacements can only be applied to MP4 format videos')
    }
    
    // Validate URL accessibility
    await validateVideoUrl(url)
    
    let videoStream: PassThrough
    
    if (format === 'mp4' && caption?.textReplacements?.length) {
      console.log(`Processing with ${caption.textReplacements.length} text replacement(s)`)
      videoStream = await TextReplacementProcessor.process(url, caption.textReplacements, options, outputName)
    } else if (format === 'mp4' && caption?.srtContent) {
      videoStream = await processVideoWithSubtitles(url, caption, options)
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
  options: any
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