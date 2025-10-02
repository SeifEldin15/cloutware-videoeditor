import type { Codecs, Encoders } from 'fluent-ffmpeg'
import ffmpeg from 'fluent-ffmpeg'
import { execFileSync } from 'node:child_process'
import { platform } from 'node:os'

// Check if we're running on Ubuntu
const isUbuntu = platform() === 'linux' && process.env.UBUNTU_CODENAME !== undefined

if (isUbuntu) {
  // Force the modern system binary (Ubuntu 6.1.1 in your shell)
  ffmpeg.setFfmpegPath('/usr/bin/ffmpeg')

  // If ffprobe is installed (usually at /usr/bin/ffprobe), set it too:
  try { 
    ffmpeg.setFfprobePath('/usr/bin/ffprobe') 
  } catch { 
    /* ignore */ 
  }

  // Optional: print the actual ffmpeg used (one-time boot log)
  try {
    const v = execFileSync('/usr/bin/ffmpeg', ['-version']).toString().split('\n')[0]
    console.log('[ffmpeg wrapper] Using:', v)
  } catch { 
    /* ignore */ 
  }
} else {
  // Use ffmpeg-installer for other platforms
  import('@ffmpeg-installer/ffmpeg').then(({ path, version }) => {
    ffmpeg.setFfmpegPath(path)
    console.info(`Installed FFmpeg ${version}`)
  }).catch(err => {
    console.error('Failed to load ffmpeg-installer:', err)
  })
}

// Export function that captioning.ts expects
export async function getInitializedFfmpeg() {
  // Since ffmpeg is already initialized above, just return it
  return ffmpeg
}

export const encoders = new Promise<Encoders>((resolve, reject) => ffmpeg.availableEncoders((err: any, res: Encoders) => err ? reject(err) : resolve(res))).then(Object.keys)
export const codecs = new Promise<Codecs>((resolve, reject) => ffmpeg.availableCodecs((err: any, res: Codecs) => err ? reject(err) : resolve(res))).then(Object.keys)
export default ffmpeg

