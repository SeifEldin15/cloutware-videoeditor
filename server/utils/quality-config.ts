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