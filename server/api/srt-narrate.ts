import { readBody, setResponseHeader } from 'h3'
import { generateSrtNarration } from '../utils/srt-narration'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)

    // Validate required fields
    if (!body.url) throw new Error('Video URL is required')
    if (!body.srt) throw new Error('SRT content is required')

    const { url, srt, options = {} } = body

    console.log(`🎙️ [SRT-Narrate] Processing narration for video: ${url}`)
    console.log(`🎙️ [SRT-Narrate] SRT content length: ${srt.length} characters`)
    console.log(`🎙️ [SRT-Narrate] Options:`, JSON.stringify(options))

    // Generate narrated video
    const narratedBuffer = await generateSrtNarration(url, srt, {
      voice: options.voice || '21m00Tcm4TlvDq8ikWAM',
      speed: options.speed || 1.0,
      stability: options.stability || 0.5,
      similarityBoost: options.similarityBoost || 0.75,
      narrationVolume: options.narrationVolume ?? 1.0,
      originalVolume: options.originalVolume ?? 0.1,
      keepOriginalAudio: options.keepOriginalAudio !== false
    })

    if (!narratedBuffer || narratedBuffer.length === 0) {
      return {
        success: false,
        message: 'No narration could be generated from the SRT content'
      }
    }

    console.log(`✅ [SRT-Narrate] Narration complete, buffer size: ${narratedBuffer.length} bytes`)

    // Set response headers for file download
    setResponseHeader(event, 'Content-Type', 'video/mp4')
    setResponseHeader(event, 'Content-Disposition', `attachment; filename="narrated_video.mp4"`)
    setResponseHeader(event, 'Content-Length', narratedBuffer.length.toString())

    return narratedBuffer
  } catch (error) {
    console.error('❌ [SRT-Narrate] Error:', error)
    event.node.res.statusCode = 500

    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    return {
      success: false,
      error: 'Failed to generate SRT narration: ' + errorMessage
    }
  }
})
