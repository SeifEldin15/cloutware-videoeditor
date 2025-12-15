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
  
  // Audio encoding settings
  audioCodec: string
  audioBitrate: string
  audioChannels: number
  sampleRate: number
  
  // Performance settings
  maxMuxingQueueSize: number
  
  // Container settings
  movflags: string
}

// High Quality Settings (Primary - for final output)
export const HIGH_QUALITY_CONFIG: VideoQualityConfig = {
  videoCodec: 'libx264',
  preset: 'slow',           // Best compression efficiency
  crf: 15,                  // Very high quality
  profile: 'high',          // H.264 high profile
  level: '4.1',             // H.264 level for wide compatibility
  pixelFormat: 'yuv420p',   // Standard compatibility
  
  audioCodec: 'aac',
  audioBitrate: '256k',     // High audio quality
  audioChannels: 2,         // Stereo
  sampleRate: 48000,        // Professional sample rate
  
  maxMuxingQueueSize: 4096,
  movflags: '+faststart'    // Web optimization
}

// Premium Quality Settings (Ultimate - for premium processing)
export const PREMIUM_QUALITY_CONFIG: VideoQualityConfig = {
  videoCodec: 'libx264',
  preset: 'slower',         // Maximum compression efficiency
  crf: 12,                  // Near-lossless quality
  profile: 'high',
  level: '4.1',
  pixelFormat: 'yuv420p',
  
  audioCodec: 'aac',
  audioBitrate: '320k',     // Maximum AAC quality
  audioChannels: 2,
  sampleRate: 48000,
  
  maxMuxingQueueSize: 8192,
  movflags: '+faststart'
}

// Standard Quality Settings (Balanced - for faster processing)
export const STANDARD_QUALITY_CONFIG: VideoQualityConfig = {
  videoCodec: 'libx264',
  preset: 'medium',         // Balanced speed/quality
  crf: 18,                  // Good quality
  profile: 'high',
  level: '4.1', 
  pixelFormat: 'yuv420p',
  
  audioCodec: 'aac',
  audioBitrate: '192k',     // Good audio quality
  audioChannels: 2,
  sampleRate: 48000,
  
  maxMuxingQueueSize: 4096,
  movflags: '+faststart'
}

// Fast Quality Settings (Quick - for previews/testing)
export const FAST_QUALITY_CONFIG: VideoQualityConfig = {
  videoCodec: 'libx264',
  preset: 'fast',           // Faster encoding
  crf: 23,                  // Decent quality
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

/**
 * Convert quality config to FFmpeg output options array
 */
export function configToOutputOptions(config: VideoQualityConfig): string[] {
  return [
    '-c:v', config.videoCodec,
    '-preset', config.preset,
    '-crf', config.crf.toString(),
    '-profile:v', config.profile,
    '-level', config.level,
    '-pix_fmt', config.pixelFormat,
    '-c:a', config.audioCodec,
    '-b:a', config.audioBitrate,
    '-ac', config.audioChannels.toString(),
    '-ar', config.sampleRate.toString(),
    '-max_muxing_queue_size', config.maxMuxingQueueSize.toString(),
    '-movflags', config.movflags
  ]
}

/**
 * Get quality config based on quality level
 */
export function getQualityConfig(quality: 'fast' | 'standard' | 'high' | 'premium' = 'high'): VideoQualityConfig {
  switch (quality) {
    case 'premium':
      return PREMIUM_QUALITY_CONFIG
    case 'high':
      return HIGH_QUALITY_CONFIG
    case 'standard':
      return STANDARD_QUALITY_CONFIG
    case 'fast':
      return FAST_QUALITY_CONFIG
    default:
      return HIGH_QUALITY_CONFIG
  }
}

/**
 * Quality level descriptions for UI
 */
export const QUALITY_DESCRIPTIONS = {
  premium: 'Premium Quality - Near-lossless encoding, maximum file size (CRF 12, slower preset)',
  high: 'High Quality - Professional grade output, larger file size (CRF 15, slow preset)', 
  standard: 'Standard Quality - Balanced quality and file size (CRF 18, medium preset)',
  fast: 'Fast Quality - Quick processing, smaller file size (CRF 23, fast preset)'
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