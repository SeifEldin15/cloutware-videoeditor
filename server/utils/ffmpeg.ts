import ffmpeg from 'fluent-ffmpeg'

// Hardcode FFmpeg paths
const FFMPEG_PATH = '/usr/bin/ffmpeg'
const FFPROBE_PATH = '/usr/bin/ffprobe'

ffmpeg.setFfmpegPath(FFMPEG_PATH)
ffmpeg.setFfprobePath(FFPROBE_PATH)
console.log('[FFmpeg] Using hardcoded FFmpeg path:', FFMPEG_PATH)
console.log('[FFmpeg] Using hardcoded FFprobe path:', FFPROBE_PATH)

// Export function that captioning.ts expects
export async function getInitializedFfmpeg() {
  return ffmpeg
}

export default ffmpeg

