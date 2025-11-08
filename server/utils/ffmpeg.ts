import ffmpeg from 'fluent-ffmpeg'
import { execFileSync, execSync } from 'node:child_process'
import { platform } from 'node:os'
import { existsSync } from 'node:fs'

// Check if we're running on Linux (Ubuntu or any other distro)
const isLinux = platform() === 'linux'
const isWindows = platform() === 'win32'

// Check if system FFmpeg is available
function hasSystemFFmpeg() {
  try {
    execSync('which ffmpeg', { stdio: 'ignore' })
    return true
  } catch {
    return false
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
      
      if (isLinux && hasSystemFFmpeg()) {
        // Use system FFmpeg on Linux (better compatibility, newer version)
        const systemFfmpegPath = execSync('which ffmpeg').toString().trim()
        const systemFfprobePath = existsSync('/usr/bin/ffprobe') ? '/usr/bin/ffprobe' : null
        
        ffmpeg.setFfmpegPath(systemFfmpegPath)
        console.log(`[Linux] Using system FFmpeg at: ${systemFfmpegPath}`)

        if (systemFfprobePath) {
          ffmpeg.setFfprobePath(systemFfprobePath)
          console.log(`[Linux] Using system FFprobe at: ${systemFfprobePath}`)
        }

        // Print version for debugging
        try {
          const v = execFileSync(systemFfmpegPath, ['-version']).toString().split('\n')[0]
          console.log('[FFmpeg] Version:', v)
        } catch { 
          /* ignore */ 
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
        // Use ffmpeg-installer for other platforms (Mac, etc.)
        const ffmpegPkg = await import('@ffmpeg-installer/ffmpeg')
        const ffprobePkg = await import('@ffprobe-installer/ffprobe')
        
        const ffmpegPath = (ffmpegPkg as any).default?.path || (ffmpegPkg as any).path
        const ffprobePath = (ffprobePkg as any).default?.path || (ffprobePkg as any).path
        
        ffmpeg.setFfmpegPath(ffmpegPath)
        ffmpeg.setFfprobePath(ffprobePath)
        
        console.info(`Installed FFmpeg at: ${ffmpegPath}`)
        console.info(`Installed FFprobe at: ${ffprobePath}`)
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

