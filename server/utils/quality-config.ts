/**
 * Centralized Video Quality Configuration
 * 
 * This file contains all video processing quality settings to ensure
 * consistent high-quality output across all processors.
 */

export interface VideoQualityConfig {
  // Video encoding settings
  videoCodec: string
  preset: string
  crf: number
  profile: string
  level: string
  pixelFormat: string
  tune?: string              // Optional tune parameter (e.g., 'stillimage' for text)
  
  // Audio encoding settings
  audioCodec: string
  audioBitrate: string
  audioChannels: number
  sampleRate: number
  
  // Performance settings
  maxMuxingQueueSize: number
  
  // Container settings
  movflags: string

  // GPU specific
  cq?: number
}

// GPU mode - only enable when explicitly set in environment (for Vast.ai GPU server)
// Don't force GPU on by default - main server doesn't have one
const USE_GPU = process.env.USE_GPU === 'true' || process.env.FORCE_GPU === 'true'

// GPU Quality Settings (NVIDIA NVENC)
// Compatible with FFmpeg 4.4 (Ubuntu 22.04) - uses h264_nvenc with llhq/hq presets
export const GPU_PREMIUM_CONFIG: VideoQualityConfig = {
  videoCodec: 'h264_nvenc',
  preset: 'slow',           // NVENC preset: slow = highest quality (FFmpeg 4.4 compatible)
  crf: 0,                   // Unused for NVENC
  cq: 19,                   // High quality (lower is better)
  profile: 'high',
  level: '4.1',
  pixelFormat: 'yuv420p',
  
  audioCodec: 'aac',
  audioBitrate: '320k',
  audioChannels: 2,
  sampleRate: 48000,
  
  maxMuxingQueueSize: 8192,
  movflags: '+faststart'
}

export const GPU_HIGH_CONFIG: VideoQualityConfig = {
  videoCodec: 'h264_nvenc',
  preset: 'medium',         // NVENC preset (FFmpeg 4.4 compatible)
  crf: 0,
  cq: 23,                   // Good quality
  profile: 'high',
  level: '4.1',
  pixelFormat: 'yuv420p',
  
  audioCodec: 'aac',
  audioBitrate: '256k',
  audioChannels: 2,
  sampleRate: 48000,
  
  maxMuxingQueueSize: 4096,
  movflags: '+faststart'
}

export const GPU_STANDARD_CONFIG: VideoQualityConfig = {
  videoCodec: 'h264_nvenc',
  preset: 'fast',            // NVENC preset (FFmpeg 4.4 compatible)
  crf: 0,
  cq: 26,                   // Standard quality
  profile: 'high',
  level: '4.1', 
  pixelFormat: 'yuv420p',
  
  audioCodec: 'aac',
  audioBitrate: '192k',
  audioChannels: 2,
  sampleRate: 48000,
  
  maxMuxingQueueSize: 4096,
  movflags: '+faststart'
}

export const GPU_FAST_CONFIG: VideoQualityConfig = {
  videoCodec: 'h264_nvenc',
  preset: 'hp',              // High Performance (FFmpeg 4.4 compatible)
  crf: 0,
  cq: 30,                   // Lower quality
  profile: 'high',
  level: '4.1',
  pixelFormat: 'yuv420p',
  
  audioCodec: 'aac', 
  audioBitrate: '128k',
  audioChannels: 2,
  sampleRate: 44100,
  
  maxMuxingQueueSize: 4096,
  movflags: '+faststart'
}

// High Quality Settings (Primary - for final output)
// Optimized for t2.medium: use veryfast preset with lower CRF for equivalent quality
export const HIGH_QUALITY_CONFIG: VideoQualityConfig = {
  videoCodec: 'libx264',
  preset: 'veryfast',       // 8x faster than 'slow', compensated with lower CRF
  crf: 17,                  // Compensate for faster preset (visually equivalent to slow@18)
  profile: 'high',          // H.264 high profile
  level: '4.1',             // H.264 level for wide compatibility
  pixelFormat: 'yuv420p',   // Standard compatibility
  
  audioCodec: 'aac',
  audioBitrate: '192k',     // Reduced from 256k (inaudible difference)
  audioChannels: 2,         // Stereo
  sampleRate: 48000,        // Professional sample rate
  
  maxMuxingQueueSize: 4096,
  movflags: '+faststart'    // Web optimization
}

// Premium Quality Settings (Ultimate - for premium processing)
// Optimized for t2.medium: 'medium' preset is practical max for CPU encoding
export const PREMIUM_QUALITY_CONFIG: VideoQualityConfig = {
  videoCodec: 'libx264',
  preset: 'medium',         // Practical ceiling for t2.medium (was 'slower')
  crf: 15,                  // Compensate with lower CRF (was 12)
  profile: 'high',
  level: '4.1',
  pixelFormat: 'yuv420p',
  
  audioCodec: 'aac',
  audioBitrate: '256k',     // High quality (was 320k)
  audioChannels: 2,
  sampleRate: 48000,
  
  maxMuxingQueueSize: 8192,
  movflags: '+faststart'
}

// Standard Quality Settings (Balanced - for faster processing)
export const STANDARD_QUALITY_CONFIG: VideoQualityConfig = {
  videoCodec: 'libx264',
  preset: 'veryfast',       // Fast encoding (was 'medium')
  crf: 18,                  // Good quality
  profile: 'high',
  level: '4.1', 
  pixelFormat: 'yuv420p',
  
  audioCodec: 'aac',
  audioBitrate: '160k',     // Good audio quality (was 192k)
  audioChannels: 2,
  sampleRate: 48000,
  
  maxMuxingQueueSize: 4096,
  movflags: '+faststart'
}

// Fast Quality Settings (Quick - for previews/testing)
export const FAST_QUALITY_CONFIG: VideoQualityConfig = {
  videoCodec: 'libx264',
  preset: 'ultrafast',      // Maximum speed (was 'fast')
  crf: 20,                  // Lower CRF to compensate (was 23)
  profile: 'high',
  level: '4.1',
  pixelFormat: 'yuv420p',
  
  audioCodec: 'aac', 
  audioBitrate: '128k',     // Standard audio quality
  audioChannels: 2,
  sampleRate: 44100,        // Standard sample rate
  
  maxMuxingQueueSize: 4096,
  movflags: '+faststart'
}

// TEXT/SUBTITLE Quality Settings - Optimized for crisp text rendering
// Uses medium preset + stillimage tune to prevent text artifacts
export const TEXT_QUALITY_CONFIG: VideoQualityConfig = {
  videoCodec: 'libx264',
  preset: 'medium',         // Medium preset required for crisp text (fast presets blur text)
  crf: 18,                  // Good quality
  profile: 'high',
  level: '4.1',
  pixelFormat: 'yuv420p',
  tune: 'stillimage',       // Optimizes for sharp edges like text/graphics
  
  audioCodec: 'aac',
  audioBitrate: '192k',
  audioChannels: 2,
  sampleRate: 48000,
  
  maxMuxingQueueSize: 4096,
  movflags: '+faststart'
}

/**
 * Convert quality config to FFmpeg output options array
 */
export function configToOutputOptions(config: VideoQualityConfig): string[] {
  const options = [
    '-c:v', config.videoCodec,
    '-preset', config.preset,
    '-profile:v', config.profile,
    '-level', config.level,
    '-pix_fmt', config.pixelFormat
  ]
  
  // Add tune parameter if specified (important for text rendering)
  if (config.tune) {
    options.push('-tune', config.tune)
  }
  
  options.push(
    '-c:a', config.audioCodec,
    '-b:a', config.audioBitrate,
    '-ac', config.audioChannels.toString(),
    '-ar', config.sampleRate.toString(),
    '-max_muxing_queue_size', config.maxMuxingQueueSize.toString(),
    '-movflags', config.movflags
  )

  // Handle specific quality control flags based on codec
  if (config.videoCodec === 'h264_nvenc' && config.cq !== undefined) {
    // NVENC uses -cq for Constant Quality with VBR
    options.push('-rc', 'vbr', '-cq', config.cq.toString())
  } else {
    // libx264 uses -crf
    options.push('-crf', config.crf.toString())
  }

  return options
}

/**
 * Get quality config based on quality level
 */
export function getQualityConfig(quality: 'fast' | 'standard' | 'high' | 'premium' = 'high'): VideoQualityConfig {
  if (USE_GPU) {
      console.log(`🚀 Using GPU-accelerated configuration (NVENC) for ${quality} quality`)
      switch (quality) {
      case 'premium': return GPU_PREMIUM_CONFIG
      case 'high': return GPU_HIGH_CONFIG
      case 'standard': return GPU_STANDARD_CONFIG
      case 'fast': return GPU_FAST_CONFIG
      default: return GPU_HIGH_CONFIG
    }
  }

  // Fallback to CPU configs
  switch (quality) {
    case 'premium':
      return PREMIUM_QUALITY_CONFIG
    case 'high':
      return HIGH_QUALITY_CONFIG
    case 'standard':
      return STANDARD_QUALITY_CONFIG
    case 'fast':
      return FAST_QUALITY_CONFIG
    case 'text':
      return TEXT_QUALITY_CONFIG
    default:
      return HIGH_QUALITY_CONFIG
  }
}

/**
 * Get quality config specifically optimized for text/subtitle rendering
 * Always returns TEXT_QUALITY_CONFIG regardless of complexity
 */
export function getTextQualityConfig(): VideoQualityConfig {
  return TEXT_QUALITY_CONFIG
}

/**
 * Quality level descriptions for UI
 * (Optimized for t2.medium AWS instances)
 */
export const QUALITY_DESCRIPTIONS = {
  premium: 'Premium Quality - High quality encoding, larger file size (CRF 15, medium preset)',
  high: 'High Quality - Professional grade, fast processing (CRF 17, veryfast preset)', 
  standard: 'Standard Quality - Balanced quality and speed (CRF 18, veryfast preset)',
  fast: 'Fast Quality - Maximum speed processing (CRF 20, ultrafast preset)',
  text: 'Text Quality - Optimized for crisp subtitles/text (CRF 18, medium preset + stillimage tune)'
} as const

export type QualityLevel = keyof typeof QUALITY_DESCRIPTIONS

/**
 * Calculate transformation complexity score
 * Higher score = more complex processing
 */
export function calculateTransformationComplexity(options?: Record<string, any>): number {
  if (!options) return 0
  
  let complexity = 0
  
  // Heavy filters (10 points each)
  if (options.blur && options.blur > 0) complexity += options.blur * 3  // blur=10 = 30 points
  if (options.rotation && options.rotation !== 0) complexity += Math.abs(options.rotation) * 2  // rotation=10 = 20 points
  if (options.sharpen && options.sharpen > 0) complexity += options.sharpen * 2  // sharpen=10 = 20 points
  
  // Medium filters (5 points each)
  if (options.zoomFactor && options.zoomFactor !== 1) complexity += Math.abs(options.zoomFactor - 1) * 20  // zoom=2 = 20 points
  if (options.speedFactor && options.speedFactor !== 1) complexity += Math.abs(options.speedFactor - 1) * 10  // speed=2 = 10 points
  if (options.saturationFactor && options.saturationFactor !== 1) complexity += 5
  if (options.brightness && options.brightness !== 0) complexity += 5
  if (options.contrast && options.contrast !== 1) complexity += 5
  if (options.lightness && options.lightness !== 0) complexity += 5
  
  // Light filters (2 points each)
  if (options.visibleChanges?.horizontalFlip) complexity += 2
  if (options.antiDetection?.pixelShift) complexity += 2
  if (options.antiDetection?.microCrop) complexity += 2
  if (options.antiDetection?.noiseAddition) complexity += 5
  if (options.antiDetection?.subtleRotation) complexity += 3
  
  return complexity
}

/**
 * Get adaptive quality based on transformation complexity
 * Heavy transformations get faster encoding to prevent timeouts
 */
export function getAdaptiveQuality(options?: Record<string, any>): QualityLevel {
  const complexity = calculateTransformationComplexity(options)
  
  console.log(`📊 Transformation complexity score: ${complexity}`)
  
  if (complexity >= 80) {
    console.log(`⚠️ Very high complexity - using fast quality for stability`)
    return 'fast'
  } else if (complexity >= 40) {
    console.log(`📋 High complexity - using standard quality`)
    return 'standard'
  } else if (complexity >= 15) {
    console.log(`✅ Medium complexity - using high quality`)
    return 'high'
  } else {
    console.log(`✨ Low complexity - using premium quality`)
    return 'premium'
  }
}