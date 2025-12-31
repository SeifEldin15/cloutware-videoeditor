import { PassThrough } from 'stream'
import { readValidatedBody, setResponseHeader } from 'h3'
import { getInitializedFfmpeg } from '../utils/ffmpeg'
import os from 'os'

const availableCpuCores = os.cpus().length
const optimalThreads = Math.max(2, Math.floor(availableCpuCores * 0.75)).toString()

export default eventHandler(async (event) => {
  try {
    const body = await readValidatedBody(event, (data: any) => {
      if (!data.url) {
        throw new Error('Video URL is required')
      }
      return {
        url: data.url,
        outputName: data.outputName || 'white_border_video',
        leftRightPercent: data.leftRightPercent || 10,
        topBottomPercent: data.topBottomPercent || 20
      }
    })

    const { url, outputName, leftRightPercent, topBottomPercent } = body

    console.log(`🎨 Adding white border filter to video: ${url}`)
    console.log(`📐 Border percentages - Left/Right: ${leftRightPercent}%, Top/Bottom: ${topBottomPercent}%`)

    // Validate URL accessibility
    try {
      const headResponse = await fetch(url, { method: 'HEAD' })
      if (!headResponse.ok) {
        throw new Error(`Video URL not accessible: ${url}`)
      }
    } catch (error) {
      throw new Error(`Cannot access video URL: ${url}`)
    }

    const videoStream = await processWithWhiteBorder(url, {
      leftRightPercent,
      topBottomPercent,
      outputName
    })

    setResponseHeader(event, 'Content-Type', 'video/mp4')
    setResponseHeader(event, 'Content-Disposition', `attachment; filename="${outputName}.mp4"`)

    return videoStream

  } catch (error) {
    console.error('❌ Error processing video with white border:', error)
    event.node.res.statusCode = 500

    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    return { error: 'Failed to process video: ' + errorMessage }
  }
})

async function processWithWhiteBorder(
  inputUrl: string,
  options: {
    leftRightPercent: number
    topBottomPercent: number
    outputName: string
  }
): Promise<PassThrough> {
  return new Promise<PassThrough>(async (resolve, reject) => {
    try {
      const outputStream = new PassThrough({ highWaterMark: 4 * 1024 * 1024 })

      let commandOutput = ''
      const ffmpeg = await getInitializedFfmpeg()
      const ffmpegCommand = ffmpeg(inputUrl)

      ffmpegCommand.inputOptions([
        '-protocol_whitelist', 'file,http,https,tcp,tls',
        '-reconnect', '1',
        '-reconnect_streamed', '1',
        '-analyzeduration', '10000000',
        '-probesize', '10000000',
        '-thread_queue_size', '512',
        '-hwaccel', 'auto',
        '-threads', optimalThreads
      ])

      // Build the filter to create white borders
      // The filter will:
      // 1. Scale the video to leave space for borders
      // 2. Pad with white color to original size
      const leftRightPercent = options.leftRightPercent
      const topBottomPercent = options.topBottomPercent

      // Calculate the visible area (what remains after borders)
      // If left+right = 10%, visible width = 100% - 10% = 90%
      // If top+bottom = 20%, visible height = 100% - 20% = 80%
      const visibleWidthPercent = 100 - leftRightPercent
      const visibleHeightPercent = 100 - topBottomPercent

      // The filter scales down the video and then pads it with white
      // Format: scale to smaller size, then pad back to original with white borders
      // We use 'iw' (input width) and 'ih' (input height) as reference
      const videoFilter = `scale=iw*${visibleWidthPercent/100}:ih*${visibleHeightPercent/100}:flags=lanczos,pad=iw/${visibleWidthPercent/100}:ih/${visibleHeightPercent/100}:(ow-iw)/2:(oh-ih)/2:white`

      console.log(`🎨 Filter complex: ${videoFilter}`)

      const outputOptions = [
        '-vf', videoFilter,
        '-c:v', 'libx264',
        '-preset', 'veryfast',                   // Fast encoding (was medium)
        '-crf', '18',
        '-profile:v', 'high',
        '-level', '4.1',
        '-threads', optimalThreads,
        '-pix_fmt', 'yuv420p',
        '-c:a', 'aac',                           // Re-encode audio to AAC for MP4 compatibility
        '-b:a', '160k',                          // Good audio quality (was 192k)
        '-ar', '48000',
        '-max_muxing_queue_size', '4096',
        '-movflags', 'frag_keyframe+empty_moov+faststart',
        '-f', 'mp4'
      ]

      ffmpegCommand
        .outputOptions(outputOptions)
        .on('start', (commandLine: string) => {
          console.log(`🎬 ${options.outputName} FFmpeg started`)
          console.log(`📋 Command: ${commandLine}`)
        })
        .on('progress', (progress: any) => {
          if (progress.percent) {
            console.log(`⏳ ${options.outputName} Processing: ${progress.percent.toFixed(2)}%`)
          }
        })
        .on('stderr', (stderrLine: string) => {
          commandOutput += stderrLine + '\n'
          if (stderrLine.includes('error') || stderrLine.includes('Error')) {
            console.error(`⚠️ ${options.outputName} FFmpeg stderr:`, stderrLine)
          }
        })
        .on('error', (err: Error) => {
          console.error(`❌ ${options.outputName} FFmpeg error:`, err)
          console.error(`📋 Command output:`, commandOutput)
          reject(new Error(`FFmpeg error: ${err.message}\nCommand output: ${commandOutput}`))
        })
        .on('end', () => {
          console.log(`✅ ${options.outputName} FFmpeg process completed`)
        })

      ffmpegCommand.pipe(outputStream, { end: true })

      resolve(outputStream)
    } catch (error) {
      console.error(`❌ ${options.outputName} processing error:`, error)
      reject(error)
    }
  })
}
