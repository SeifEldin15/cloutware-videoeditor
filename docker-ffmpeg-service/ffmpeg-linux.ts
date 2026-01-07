// Linux FFmpeg wrapper - uses system ffmpeg binary
import ffmpeg from 'fluent-ffmpeg'

// On Linux, ffmpeg is installed via apt and available in PATH
ffmpeg.setFfmpegPath('/usr/bin/ffmpeg')
ffmpeg.setFfprobePath('/usr/bin/ffprobe')

console.log('[FFmpeg] Using system FFmpeg at: /usr/bin/ffmpeg')

// Export function that captioning.ts expects
export async function getInitializedFfmpeg() {
  return ffmpeg
}

export default ffmpeg
