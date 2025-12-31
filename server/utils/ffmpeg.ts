import ffmpeg from 'fluent-ffmpeg'
import { execFileSync, execSync } from 'node:child_process'
import { platform } from 'node:os'
import { existsSync } from 'node:fs'

// Check if we're running on Linux (Ubuntu or any other distro)
const isLinux = platform() === 'linux'
const isWindows = platform() === 'win32'

// Check if system FFmpeg is available
function hasSystemFFmpeg() {
  // Allow explicit override
  if (process.env.FFMPEG_PATH) return true

  const commonPaths = ['/usr/bin/ffmpeg', '/usr/local/bin/ffmpeg', '/snap/bin/ffmpeg']
  for (const p of commonPaths) {
    if (existsSync(p)) return true
  }

  try {
    // `command -v` is more portable than `which` on some distros
    execSync('command -v ffmpeg', { stdio: 'ignore' })
    return true
  } catch {
    return false
  }
}

function resolveSystemFfmpeg(): string | null {
  if (process.env.FFMPEG_PATH) return process.env.FFMPEG_PATH

  const commonPaths = ['/usr/bin/ffmpeg', '/usr/local/bin/ffmpeg', '/snap/bin/ffmpeg']
  for (const p of commonPaths) {
    if (existsSync(p)) return p
  }

  try {
    const out = execSync('command -v ffmpeg').toString().trim()
    return out || null
  } catch {
    return null
  }
}

let ffmpegInitialized = false
let ffmpegInitPromise: Promise<void> | null = null

async function initializeFfmpeg() {
  if (ffmpegInitialized) return
  if (ffmpegInitPromise) return ffmpegInitPromise

  ffmpegInitPromise = (async () => {
    try {
      console.log('[FFmpeg] Initializing for platform:', platform())
      
      if (isLinux) {
        // Use system FFmpeg on Linux (hardcoded for Ubuntu compatibility)
        const systemFfmpegPath = '/usr/bin/ffmpeg'
        const systemFfprobePath = '/usr/bin/ffprobe'

        ffmpeg.setFfmpegPath(systemFfmpegPath)
        console.log(`[Linux] Using system FFmpeg at: ${systemFfmpegPath}`)

        if (existsSync(systemFfprobePath)) {
          ffmpeg.setFfprobePath(systemFfprobePath)
          console.log(`[Linux] Using system FFprobe at: ${systemFfprobePath}`)
        }

        // Print version for debugging
        try {
          const v = execFileSync(systemFfmpegPath, ['-version']).toString().split('\n')[0]
          console.log('[FFmpeg] Version:', v)
        } catch (e) {
          console.warn('[FFmpeg] Could not get version from system ffmpeg:', String(e))
        }

      } else if (isWindows) {
        // Use ffmpeg-installer for Windows (CommonJS style import)
        try {
          // Try both default and named exports
          const ffmpegPkg = await import('@ffmpeg-installer/ffmpeg')
          const ffprobePkg = await import('@ffprobe-installer/ffprobe')
          
          // Handle both ESM and CommonJS module formats
          const ffmpegPath = (ffmpegPkg as any).default?.path || (ffmpegPkg as any).path
          const ffprobePath = (ffprobePkg as any).default?.path || (ffprobePkg as any).path
          
          console.log('[Windows] FFmpeg package:', ffmpegPkg)
          console.log('[Windows] FFmpeg path resolved:', ffmpegPath)
          
          if (!ffmpegPath) {
            throw new Error('FFmpeg path not found. Package content: ' + JSON.stringify(Object.keys(ffmpegPkg)))
          }
          
          ffmpeg.setFfmpegPath(ffmpegPath)
          if (ffprobePath) {
            ffmpeg.setFfprobePath(ffprobePath)
            console.info(`[Windows] Installed FFprobe at: ${ffprobePath}`)
          }
          
          console.info(`[Windows] Installed FFmpeg at: ${ffmpegPath}`)
        } catch (error) {
          console.error('[Windows] Error loading FFmpeg installer:', error)
          throw error
        }
      } else {
        // Use ffmpeg-installer for other platforms (Mac, etc.) or as fallback
        // If environment points to explicit paths prefer them
        const envFfmpeg = process.env.FFMPEG_PATH
        const envFfprobe = process.env.FFPROBE_PATH

        if (envFfmpeg) {
          ffmpeg.setFfmpegPath(envFfmpeg)
          console.info(`[FFmpeg] Using FFMPEG_PATH from env: ${envFfmpeg}`)
        } else {
          const ffmpegPkg = await import('@ffmpeg-installer/ffmpeg')
          const ffprobePkg = await import('@ffprobe-installer/ffprobe')
          const ffmpegPath = (ffmpegPkg as any).default?.path || (ffmpegPkg as any).path
          const ffprobePath = (ffprobePkg as any).default?.path || (ffprobePkg as any).path
          ffmpeg.setFfmpegPath(ffmpegPath)
          ffmpeg.setFfprobePath(ffprobePath)
          console.info(`Installed FFmpeg at: ${ffmpegPath}`)
          console.info(`Installed FFprobe at: ${ffprobePath}`)
        }
      }
      
      ffmpegInitialized = true
      console.log('[FFmpeg] Initialization complete')
    } catch (error) {
      console.error('[FFmpeg] Failed to initialize:', error)
      throw error
    }
  })()

  return ffmpegInitPromise
}

// Export function that captioning.ts expects
export async function getInitializedFfmpeg() {
  await initializeFfmpeg()
  return ffmpeg
}

export default ffmpeg

// Initialize FFmpeg immediately when module is loaded
initializeFfmpeg().catch(err => {
  console.error('[FFmpeg] Failed to initialize at startup:', err)
})