import { PassThrough } from 'stream'
import ffmpeg from './ffmpeg'
import os from 'os'
import { writeFileSync, unlinkSync, existsSync, copyFileSync, mkdirSync, rmSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'
import { processVideoWithSubtitlesFile } from './captioning'
import { generateAdvancedASSFile, parseSRT, getStyleFont, getFontFilePath, type SubtitleSegment, type GirlbossStyle, processWordModeSegments, formatTimeForSRT } from './subtitleUtils'
import type { CaptionOptions, VideoProcessingOptions } from './validation-schemas'
import { resolve, join as pathJoin } from 'path'
import { getQualityConfig, configToOutputOptions, getAdaptiveQuality, getTextQualityConfig, type QualityLevel } from './quality-config'

const availableCpuCores = os.cpus().length
// Keep filtergraph single-threaded for stability
const optimalThreads = Math.max(2, Math.floor(availableCpuCores * 0.75)).toString()

// Font file mappings - matching the working ffmpeggenerator.js pattern
const fontFileMap: Record<string, string> = {
  'Montserrat Thin': 'Montserrat Thin.ttf',
  'Montserrat': 'Montserrat.ttf', 
  'Luckiest Guy': 'luckiestguy.ttf',  // Consistent with actual font file
  'Arial': 'arial.ttf',
  'Arial Black': 'Arial Black.ttf',
  'Impact': 'impact.ttf',
  'Helvetica': 'helvetica.ttf',
  'Georgia': 'georgia.ttf',
  'Times New Roman': 'TimesNewRoman.ttf',
  'Verdana': 'Verdana.ttf',
  'Trebuchet': 'Trebuchet.ttf',
  'Comic Sans MS': 'Comic Sans MS.ttf',
  'Courier New': 'Courier New.ttf',
  'Garamond': 'Garamond.ttf',
  'Palatino Linotype': 'Palatino Linotype.ttf',
  'Bookman Old Style': 'Bookman Old Style.ttf',
  'Erica One': 'Erica One.ttf',
  'Bungee': 'bungee.ttf',
  'Sigmar': 'sigmar.ttf',
  'Sora': 'sora.ttf',
  'Tahoma': 'tahoma.ttf',
  'Gotham Ultra': 'Gotham Ultra.ttf',
  'Bodoni Moda': 'Bodoni Moda.ttf',
  'Montserrat ExtraBold': 'Montserrat ExtraBold.ttf',
  'Montserrat Black': 'Montserrat Black.ttf'
};


interface StyleOptions {
  fontSize?: number
  fontFamily?: string
  textAlign?: string
  subtitleStyle?: string
  // Universal outline options
  outlineWidth?: number
  outlineColor?: string
  outlineBlur?: number
  // Universal vertical position option
  verticalPosition?: number
  // Universal shadow strength option
  shadowStrength?: number
  // Universal animation option
  animation?: string
  // Girlboss options
  girlbossColor?: string
  // Hormozi options
  hormoziColors?: string[]
  // TikTokStyle options
  tiktokstyleColor?: string
  // ThinToBold options
  thinToBoldColor?: string
  // WavyColors options
  wavyColorsOutlineWidth?: number
  // ShrinkingPairs options
  shrinkingPairsColor?: string
  // RevealEnlarge options
  revealEnlargeColors?: string[]
  // Word processing mode options
  wordMode?: 'normal' | 'single' | 'multiple'
  wordsPerGroup?: number
}

export class SubtitleProcessor {
  static async processBasic(url: string, caption: CaptionOptions, quality: QualityLevel = 'high'): Promise<PassThrough> {
    if (!caption?.srtContent) {
      throw new Error('SRT content is required for basic subtitle processing')
    }

    let srtContent = caption.srtContent;

    // Apply word mode processing for basic subtitles if specified
    if (caption.wordMode && caption.wordMode !== 'normal') {
      console.log(`🔀 Processing basic subtitles in ${caption.wordMode} word mode with ${caption.wordsPerGroup || 1} words per group`)
      
      const segments = parseSRT(caption.srtContent);
      const wordSegments = processWordModeSegments(
        segments,
        caption.wordMode,
        caption.wordsPerGroup || 1
      );
      
      // Convert word segments back to SRT format
      srtContent = wordSegments.map((segment, index) => {
        const startTime = formatTimeForSRT(segment.start);
        const endTime = formatTimeForSRT(segment.end);
        return `${index + 1}\n${startTime} --> ${endTime}\n${segment.text}\n`;
      }).join('\n');
      
      console.log(`📝 Generated ${wordSegments.length} word-level segments for basic processing`)
    }

    return processVideoWithSubtitlesFile(url, srtContent, {
      fontSize: caption.fontSize,
      fontColor: caption.fontColor,
      fontFamily: caption.fontFamily,
      fontStyle: caption.fontStyle,
      subtitlePosition: caption.subtitlePosition,
      horizontalAlignment: caption.horizontalAlignment,
      verticalMargin: caption.verticalPosition || caption.verticalMargin,
      showBackground: caption.showBackground,
      backgroundColor: caption.backgroundColor,
      outlineWidth: caption.outlineWidth,
      outlineColor: caption.outlineColor,
      outlineBlur: caption.outlineBlur
    }) as Promise<PassThrough>
  }

  static async processAdvanced(
    url: string,
    caption: CaptionOptions,
    videoOptions?: VideoProcessingOptions,
    quality: QualityLevel = 'premium'  // Default to premium quality
  ): Promise<PassThrough> {
    if (!caption?.srtContent) {
      throw new Error('SRT content is required for advanced subtitle processing')
    }

    const styleOptions = this.buildStyleOptions(caption)
    
    return this.processVideoWithAdvancedSubtitles(
      url,
      caption.srtContent,
      styleOptions,
      videoOptions,
      quality
    )
  }

  private static buildStyleOptions(caption: CaptionOptions): StyleOptions {
    // Get the style-specific font
    const styleFont = getStyleFont(caption?.subtitleStyle || 'basic', caption?.fontFamily);
    
    const baseOptions = {
      fontSize: caption?.fontSize,
      fontFamily: styleFont,
      textAlign: caption?.horizontalAlignment,
      subtitleStyle: caption?.subtitleStyle,
      // Universal outline options
      outlineWidth: caption?.outlineWidth,
      outlineColor: caption?.outlineColor,
      outlineBlur: caption?.outlineBlur,
      // Universal vertical position option
      verticalPosition: caption?.verticalPosition,
      // Universal shadow strength option
      shadowStrength: caption?.shadowStrength,
      // Universal animation option
      animation: caption?.animation,
      // Girlboss options
      girlbossColor: caption?.girlbossColor,
      // Hormozi options
      hormoziColors: caption?.hormoziColors,
      // TikTokStyle options
      tiktokstyleColor: caption?.tiktokstyleColor,
      // ThinToBold options
      thinToBoldColor: caption?.thinToBoldColor,
      // WavyColors options
      wavyColorsOutlineWidth: caption?.wavyColorsOutlineWidth,
      // ShrinkingPairs options
      shrinkingPairsColor: caption?.shrinkingPairsColor,
      // RevealEnlarge options
      revealEnlargeColors: caption?.revealEnlargeColors,
      // Word processing mode options
      wordMode: caption?.wordMode,
      wordsPerGroup: caption?.wordsPerGroup
    }
    // Add _jobId for progress tracking (if present)
    if ((caption as any)?._jobId) {
      (baseOptions as any)._jobId = (caption as any)._jobId
    }
    return baseOptions
  }

  private static async processVideoWithAdvancedSubtitles(
    inputUrl: string,
    srtContent: string,
    styleOptions: StyleOptions,
    videoOptions?: VideoProcessingOptions,
    quality: QualityLevel = 'premium'
  ): Promise<PassThrough> {
    console.log(`Processing video with ${styleOptions.subtitleStyle} style subtitles...`)

    return new Promise<PassThrough>((resolve, reject) => {
      let tempAssFile: string | null = null
      let fontCleanup: (() => void) | null = null

      try {
        let subtitleSegments = parseSRT(srtContent)
        if (subtitleSegments.length === 0) {
          throw new Error('No valid subtitle segments found in SRT content')
        }

        // Process word mode if specified
        if (styleOptions.wordMode && styleOptions.wordMode !== 'normal') {
          console.log(`🔀 Processing subtitles in ${styleOptions.wordMode} word mode with ${styleOptions.wordsPerGroup || 1} words per group`)
          subtitleSegments = processWordModeSegments(
            subtitleSegments,
            styleOptions.wordMode,
            styleOptions.wordsPerGroup || 1
          )
          console.log(`📝 Generated ${subtitleSegments.length} word-level segments`)
        }

        console.log(`🔍 Style: ${styleOptions.subtitleStyle}, Font requested: ${styleOptions.fontFamily}`)
        
        const fontFilePath = getFontFilePath(styleOptions.fontFamily || 'Arial')
        let fontFile: string | null = null
        let fontsDir: string | null = null
        
        if (fontFilePath && existsSync(fontFilePath)) {
          // Create a fonts directory in the current working directory to avoid drive path issues
          fontsDir = pathJoin(process.cwd(), 'temp_fonts_' + Date.now())
          try {
            mkdirSync(fontsDir, { recursive: true })
          } catch (error) {
            console.warn(`⚠️ Fonts directory creation failed: ${error}`)
          }
          
          // Copy font to the fonts directory with the expected name
          const fontFileName = `${styleOptions.fontFamily || 'Arial'}.ttf`
          fontFile = pathJoin(fontsDir, fontFileName)
          try {
            copyFileSync(fontFilePath, fontFile)
            console.log(`✅ Font copied: ${fontFilePath} -> ${fontFile}`)
          } catch (error) {
            console.warn(`⚠️ Font copy failed: ${error}`)
            fontFile = null
            fontsDir = null
          }
        }
        
        fontCleanup = () => {
          if (fontFile && existsSync(fontFile)) {
            try {
              unlinkSync(fontFile)
              console.log(`🧹 Cleaned up font file: ${fontFile}`)
            } catch (error) {
              console.warn(`⚠️ Font cleanup failed: ${error}`)
            }
          }
          if (fontsDir && existsSync(fontsDir)) {
            try {
              rmSync(fontsDir, { recursive: true, force: true })
              console.log(`🧹 Cleaned up fonts directory: ${fontsDir}`)
            } catch (error) {
              console.warn(`⚠️ Fonts directory cleanup failed: ${error}`)
            }
          }
        }

        let assContent = ''

        if (styleOptions.subtitleStyle === 'girlboss') {
          console.log(`🎨 Setting up Girlboss with font: ${styleOptions.fontFamily} -> ${styleOptions.fontFamily}`)
          const girlbossStyle: GirlbossStyle & {
            fontSize?: number
            fontFamily?: string
            fontFilePath?: string
            textAlign?: string
            outlineWidth?: number
            outlineColor?: string
            outlineBlur?: number
          } = {
            color: styleOptions.girlbossColor || '#F361D8',
            shadowStrength: styleOptions.shadowStrength ?? 1.5,
            animation: styleOptions.animation === 'shake' ? 'shake' : 'none',
            verticalPosition: styleOptions.verticalPosition || 15,
            fontSize: styleOptions.fontSize || 50,
            fontFamily: styleOptions.fontFamily || 'Arial',
            fontFilePath: fontFile || styleOptions.fontFamily || 'Arial',
            textAlign: styleOptions.textAlign || 'center',
            outlineWidth: styleOptions.outlineWidth || 2,
            outlineColor: styleOptions.outlineColor || '#000000',
            outlineBlur: styleOptions.outlineBlur || 0
          }
          assContent = generateAdvancedASSFile(subtitleSegments, girlbossStyle, 'girlboss')

        } else if (styleOptions.subtitleStyle === 'hormozi') {
          console.log(`🚀 Setting up Hormozi with font: ${styleOptions.fontFamily} -> ${styleOptions.fontFamily}`)
          const hormoziStyle: GirlbossStyle & {
            fontSize?: number
            fontFamily?: string
            fontFilePath?: string
            textAlign?: string
            alternateColors?: string[]
            outlineWidth?: number
            outlineColor?: string
            outlineBlur?: number
          } = {
            shadowStrength: styleOptions.shadowStrength ?? 1.5,
            animation: styleOptions.animation === 'shake' ? 'shake' : 'none',
            verticalPosition: styleOptions.verticalPosition || 15,
            fontSize: styleOptions.fontSize || 50,
            fontFamily: styleOptions.fontFamily || 'Arial',
            fontFilePath: fontFile || styleOptions.fontFamily || 'Arial',
            textAlign: styleOptions.textAlign || 'center',
            alternateColors: styleOptions.hormoziColors || ['#0BF431', '#2121FF', '#1DE0FE', '#FFFF00'],
            outlineWidth: styleOptions.outlineWidth || 2,
            outlineColor: styleOptions.outlineColor || '#000000',
            outlineBlur: styleOptions.outlineBlur || 0
          }
          assContent = generateAdvancedASSFile(subtitleSegments, hormoziStyle, 'hormozi')

        } else if (styleOptions.subtitleStyle === 'tiktokstyle') {
          console.log(`🎵 Setting up TikTokStyle with font: ${styleOptions.fontFamily} -> ${styleOptions.fontFamily}`)
          const tiktokStyleStyle: GirlbossStyle & {
            fontSize?: number
            fontFamily?: string
            fontFilePath?: string
            textAlign?: string
            outlineWidth?: number
            outlineColor?: string
            outlineBlur?: number
          } = {
            color: styleOptions.tiktokstyleColor || '#FFFF00',
            shadowStrength: styleOptions.shadowStrength ?? 1.5,
            animation: styleOptions.animation === 'shake' ? 'shake' : 'none',
            verticalPosition: styleOptions.verticalPosition || 15,
            fontSize: styleOptions.fontSize || 50,
            fontFamily: styleOptions.fontFamily || 'Arial',
            fontFilePath: fontFile || styleOptions.fontFamily || 'Arial',
            textAlign: styleOptions.textAlign || 'center',
            outlineWidth: styleOptions.outlineWidth || 2,
            outlineColor: styleOptions.outlineColor || '#000000',
            outlineBlur: styleOptions.outlineBlur || 0
          }
          assContent = generateAdvancedASSFile(subtitleSegments, tiktokStyleStyle, 'tiktokstyle')

        } else if (styleOptions.subtitleStyle === 'thintobold') {
          console.log(`✨ Setting up ThinToBold with font: ${styleOptions.fontFamily} -> ${styleOptions.fontFamily}, wordsPerGroup: ${styleOptions.wordsPerGroup || 4}`)
          const thinToBoldStyle: GirlbossStyle & {
            fontSize?: number
            fontFamily?: string
            fontFilePath?: string
            textAlign?: string
            outlineWidth?: number
            outlineColor?: string
            outlineBlur?: number
            wordsPerGroup?: number
          } = {
            color: styleOptions.thinToBoldColor || '#FFFFFF',
            shadowStrength: styleOptions.shadowStrength ?? 1.5,
            animation: styleOptions.animation === 'shake' ? 'shake' : 'none',
            verticalPosition: styleOptions.verticalPosition || 15,
            fontSize: styleOptions.fontSize || 50,
            fontFamily: styleOptions.fontFamily || 'Arial',
            fontFilePath: fontFile || styleOptions.fontFamily || 'Arial',
            textAlign: styleOptions.textAlign || 'center',
            outlineWidth: styleOptions.outlineWidth || 2,
            outlineColor: styleOptions.outlineColor || '#000000',
            outlineBlur: styleOptions.outlineBlur || 0,
            wordsPerGroup: styleOptions.wordsPerGroup || 4
          }
          assContent = generateAdvancedASSFile(subtitleSegments, thinToBoldStyle, 'thintobold')

        } else if (styleOptions.subtitleStyle === 'wavycolors') {
          console.log(`🌈 Setting up WavyColors with font: ${styleOptions.fontFamily} -> ${styleOptions.fontFamily}`)
          const wavyStyle: GirlbossStyle & {
            fontSize?: number
            fontFamily?: string
            fontFilePath?: string
            textAlign?: string
            textOutlineWidth?: number
            outlineWidth?: number
            outlineColor?: string
            outlineBlur?: number
          } = {
            verticalPosition: styleOptions.verticalPosition || 15,
            fontSize: styleOptions.fontSize || 50,
            fontFamily: styleOptions.fontFamily || 'Arial',
            fontFilePath: fontFile || styleOptions.fontFamily || 'Arial',
            textAlign: styleOptions.textAlign || 'center',
            textOutlineWidth: styleOptions.wavyColorsOutlineWidth || 2,
            outlineWidth: styleOptions.outlineWidth || 2,
            outlineColor: styleOptions.outlineColor || '#000000',
            outlineBlur: styleOptions.outlineBlur || 0
          }
          assContent = generateAdvancedASSFile(subtitleSegments, wavyStyle, 'wavycolors')

        } else if (styleOptions.subtitleStyle === 'shrinkingpairs') {
          console.log(`📉 Setting up ShrinkingPairs with font: ${styleOptions.fontFamily} -> ${styleOptions.fontFamily}, wordsPerGroup: ${styleOptions.wordsPerGroup || 4}`)
          const shrinkingPairsStyle: GirlbossStyle & {
            fontSize?: number
            fontFamily?: string
            fontFilePath?: string
            textAlign?: string
            textOutlineWidth?: number
            shadowStrength?: number
            outlineWidth?: number
            outlineColor?: string
            outlineBlur?: number
            wordsPerGroup?: number
          } = {
            color: styleOptions.shrinkingPairsColor || '#0BF431',
            shadowStrength: styleOptions.shadowStrength ?? 1.5,
            animation: styleOptions.animation === 'shake' ? 'shake' : 'none',
            verticalPosition: styleOptions.verticalPosition || 15,
            fontSize: styleOptions.fontSize || 50,
            fontFamily: styleOptions.fontFamily || 'Arial',
            fontFilePath: fontFile || styleOptions.fontFamily || 'Arial',
            textAlign: styleOptions.textAlign || 'center',
            textOutlineWidth: styleOptions.outlineWidth || 2,
            outlineWidth: styleOptions.outlineWidth || 2,
            outlineColor: styleOptions.outlineColor || '#000000',
            outlineBlur: styleOptions.outlineBlur || 0,
            wordsPerGroup: styleOptions.wordsPerGroup || 4
          }
          assContent = generateAdvancedASSFile(subtitleSegments, shrinkingPairsStyle, 'shrinkingpairs')

        } else if (styleOptions.subtitleStyle === 'revealenlarge') {
          console.log(`🔍 Setting up RevealEnlarge with font: ${styleOptions.fontFamily} -> ${styleOptions.fontFamily}`)
          const revealEnlargeStyle: GirlbossStyle & {
            fontSize?: number
            fontFamily?: string
            fontFilePath?: string
            textAlign?: string
            alternateColors?: string[]
            textOutlineWidth?: number
            shadowStrength?: number
            outlineWidth?: number
            outlineColor?: string
            outlineBlur?: number
          } = {
            shadowStrength: styleOptions.shadowStrength ?? 1.5,
            animation: styleOptions.animation === 'shake' ? 'shake' : 'none',
            verticalPosition: styleOptions.verticalPosition || 15,
            fontSize: styleOptions.fontSize || 50,
            fontFamily: styleOptions.fontFamily || 'Arial',
            fontFilePath: fontFile || styleOptions.fontFamily || 'Arial',
            textAlign: styleOptions.textAlign || 'center',
            alternateColors: styleOptions.revealEnlargeColors || ['#0BF431', '#2121FF', '#1DE0FE', '#FFFF00'],
            textOutlineWidth: styleOptions.outlineWidth || 2,
            outlineWidth: styleOptions.outlineWidth || 2,
            outlineColor: styleOptions.outlineColor || '#000000',
            outlineBlur: styleOptions.outlineBlur || 0
          }
          assContent = generateAdvancedASSFile(subtitleSegments, revealEnlargeStyle, 'revealenlarge')

        } else if (styleOptions.subtitleStyle === 'whiteimpact') {
          console.log(`⚡ Setting up WhiteImpact with font: ${styleOptions.fontFamily} -> ${styleOptions.fontFamily}`)
          const whiteImpactStyle: GirlbossStyle & {
            fontSize?: number
            fontFamily?: string
            fontFilePath?: string
            textAlign?: string
            shadowStrength?: number
            outlineWidth?: number
            outlineColor?: string
            outlineBlur?: number
          } = {
            shadowStrength: styleOptions.shadowStrength ?? 1.5,
            animation: styleOptions.animation === 'shake' ? 'shake' : 'none',
            verticalPosition: styleOptions.verticalPosition || 20,
            fontSize: styleOptions.fontSize || 48,
            fontFamily: styleOptions.fontFamily || 'Impact',
            fontFilePath: fontFile || styleOptions.fontFamily || 'Impact',
            textAlign: styleOptions.textAlign || 'center',
            outlineWidth: styleOptions.outlineWidth || 1,
            outlineColor: styleOptions.outlineColor || '#000000',
            outlineBlur: styleOptions.outlineBlur || 0
          }
          assContent = generateAdvancedASSFile(subtitleSegments, whiteImpactStyle, 'whiteimpact')

        } else if (styleOptions.subtitleStyle === 'impactfull') {
          console.log(`💥 Setting up ImpactFull with font: ${styleOptions.fontFamily} -> ${styleOptions.fontFamily}`)
          const impactFullStyle: GirlbossStyle & {
            fontSize?: number
            fontFamily?: string
            fontFilePath?: string
            textAlign?: string
            shadowStrength?: number
            outlineWidth?: number
            outlineColor?: string
            outlineBlur?: number
          } = {
            shadowStrength: styleOptions.shadowStrength ?? 1.5,
            animation: styleOptions.animation === 'shake' ? 'shake' : 'none',
            verticalPosition: styleOptions.verticalPosition || 25,
            fontSize: styleOptions.fontSize || 42,
            fontFamily: styleOptions.fontFamily || 'Impact',
            fontFilePath: fontFile || styleOptions.fontFamily || 'Impact',
            textAlign: styleOptions.textAlign || 'center',
            outlineWidth: styleOptions.outlineWidth || 1,
            outlineColor: styleOptions.outlineColor || '#000000',
            outlineBlur: styleOptions.outlineBlur || 0
          }
          assContent = generateAdvancedASSFile(subtitleSegments, impactFullStyle, 'impactfull')
        }

        tempAssFile = join(tmpdir(), `subtitle_${Date.now()}.ass`)
        writeFileSync(tempAssFile, assContent)

        const outputStream = new PassThrough({ highWaterMark: 4 * 1024 * 1024 })

        let commandOutput = ''
        const ffmpegCommand = ffmpeg(inputUrl)

        // Using system fonts now for compatibility

        // Check if GPU mode is enabled
        const useGpu = process.env.USE_GPU === 'true'
        
        const inputOpts = [
          '-protocol_whitelist', 'file,http,https,tcp,tls',
          '-analyzeduration', '10000000',
          '-probesize', '10000000',
          '-thread_queue_size', '512',
        ]
        
        if (useGpu) {
          // NVIDIA CUDA hardware acceleration
          inputOpts.push(
            '-hwaccel', 'cuda',
            '-hwaccel_output_format', 'cuda'  // Keep frames on GPU
          )
          console.log('🚀 Using NVIDIA CUDA hardware acceleration')
        } else {
          inputOpts.push('-hwaccel', 'auto')
        }
        
        // Add -ss as INPUT option for fast seeking (timestamps reset to 0 after seek)
        if (videoOptions?.trimStart !== undefined && videoOptions?.trimStart > 0) {
          inputOpts.push('-ss', videoOptions.trimStart.toString())
          console.log(`✂️ Trim: seeking to ${videoOptions.trimStart}s`)
        }

        inputOpts.push('-threads', optimalThreads)

        ffmpegCommand.inputOptions(inputOpts)

        console.log(`🔧 Video options received:`, JSON.stringify(videoOptions, null, 2))
        const advancedOptions = videoOptions ? this.buildAdvancedProcessingOptions(videoOptions, quality) : []
        console.log(`🔧 Advanced options built:`, advancedOptions)

        let baseVideoFilter = ''
        const vfIndex = advancedOptions.findIndex(opt => opt === '-vf')
        if (vfIndex !== -1 && vfIndex + 1 < advancedOptions.length) {
          baseVideoFilter = advancedOptions[vfIndex + 1]
          console.log(`🔧 Found -vf filter at index ${vfIndex}: ${baseVideoFilter}`)
        } else {
          console.log(`⚠️ No -vf filter found in advanced options`)
        }

        const escapedPath = tempAssFile.replace(/\\/g, '/').replace(/:/g, '\\:')
        
        // Build video filter chain: transformations FIRST, then subtitles LAST
        // This ensures subtitles are not affected by video transformations (blur, rotation, etc.)
        const vf: string[] = []
        
        // 1. Add video transformation filters FIRST (before subtitles)
        if (baseVideoFilter) {
          // Split carefully - some filters have colons inside, but comma separates them
          // We need to preserve filters like eq=brightness=0.5:contrast=1.2
          const existingFilters = baseVideoFilter.split(',').filter(f => 
            !f.includes('subtitles=') && 
            !f.includes('ass=') &&
            f.trim().length > 0
          )
          if (existingFilters.length > 0) {
            vf.push(...existingFilters)
            console.log(`🎬 Adding video transformations: ${existingFilters.join(', ')}`)
          }
        }
        
        // 2. Add scale filter for compatibility (avoid odd dimensions)
        vf.push("scale=trunc(iw/2)*2:trunc(ih/2)*2")
        
        // 3. Add subtitle filter LAST (so it's not affected by transformations)
        if (fontsDir && existsSync(fontsDir)) {
          // Use relative path to avoid Windows drive path issues
          const relativeFontsPath = fontsDir.replace(process.cwd(), '.').replace(/\\/g, '/')
          vf.push(`ass='${escapedPath}':fontsdir=${relativeFontsPath}`)
          console.log(`🎨 Using fonts from: ${relativeFontsPath}`)
        } else {
          // Fallback without fontsdir - rely on system fonts
          vf.push(`ass='${escapedPath}'`)
          console.log(`🎨 Using system fonts only`)
        }
        
        const videoFilter = vf.join(',')
        console.log(`🎨 Final video filter chain: ${videoFilter}`)

        const outputOptions = ['-vf', videoFilter]

        const afIndex = advancedOptions.findIndex(opt => opt === '-af')
        const filterComplexIndex = advancedOptions.findIndex(opt => opt === '-filter_complex')
        const mapOptions = advancedOptions.filter((opt, idx) =>
          advancedOptions[idx - 1] === '-map' || opt === '-map'
        )

        if (afIndex !== -1 && afIndex + 1 < advancedOptions.length) {
          outputOptions.push('-af', advancedOptions[afIndex + 1])
        } else if (filterComplexIndex !== -1 && filterComplexIndex + 1 < advancedOptions.length) {
          outputOptions.push('-filter_complex', advancedOptions[filterComplexIndex + 1])
          for (let i = 0; i < mapOptions.length; i += 2) {
            if (mapOptions[i] === '-map' && mapOptions[i + 1]) {
              outputOptions.push('-map', mapOptions[i + 1])
            }
          }
        }

        // Using system fonts for compatibility

        const codecOptions = advancedOptions.filter((opt, idx) =>
          opt === '-c:v' || opt === '-c:a' || opt === '-crf' || opt === '-b:a' ||
          (advancedOptions[idx - 1] === '-c:v') || (advancedOptions[idx - 1] === '-c:a') ||
          (advancedOptions[idx - 1] === '-crf') || (advancedOptions[idx - 1] === '-b:a')
        )

        
        if (codecOptions.length > 0) {
          outputOptions.push(...codecOptions)
        } else {
          // Use TEXT quality config for crisp subtitle rendering
          // (fast presets cause text to look blurry/blocky)
          const qualityConfig = getTextQualityConfig()
          const qualityOptions = configToOutputOptions(qualityConfig)
          outputOptions.push(...qualityOptions)
        }

        // Add -t as OUTPUT option: limits how many seconds to encode from the seeked position.
        // Must be output-side because -ss as input resets timestamps to 0.
        if (videoOptions?.trimEnd !== undefined && videoOptions.trimEnd > 0) {
          const trimDuration = videoOptions.trimEnd - (videoOptions.trimStart || 0)
          if (trimDuration > 0) {
            outputOptions.push('-t', trimDuration.toString())
            console.log(`✂️ Trim: encoding ${trimDuration}s (${videoOptions.trimStart || 0}s → ${videoOptions.trimEnd}s)`)
          }
        }

        outputOptions.push('-threads', optimalThreads, '-pix_fmt', 'yuv420p', '-f', 'mpegts')

        let ffmpegCompleted = false
        let streamTimeout: NodeJS.Timeout | null = null
        
        ffmpegCommand.outputOptions(outputOptions)
          .on('start', (commandLine: string) => {
            console.log('Advanced subtitle FFmpeg started:', commandLine)
          })
          .on('progress', (progress: any) => {
            if (progress.percent) {
              console.log(`Advanced subtitle processing: ${progress.percent.toFixed(2)}%`)
              // Report progress to job tracker (10-95% range for FFmpeg encoding)
              const jobId = (styleOptions as any)._jobId
              if (jobId && typeof (global as any).setJobProgress === 'function') {
                const scaledProgress = Math.round(10 + (progress.percent * 0.85)) // Scale 0-100% to 10-95%
                ;(global as any).setJobProgress(jobId, scaledProgress, `Encoding: ${Math.round(progress.percent)}%`)
              }
            }
          })
          .on('stderr', (stderrLine: string) => {
            commandOutput += stderrLine + '\n'
            console.log('Advanced subtitle FFmpeg stderr:', stderrLine)
          })
          .on('error', (err: Error) => {
            console.error('Advanced subtitle FFmpeg error:', err)
            console.error('Command output:', commandOutput)
            if (streamTimeout) clearTimeout(streamTimeout)
            this.cleanupTempFile(tempAssFile)
            if (fontCleanup) fontCleanup()
            if (!outputStream.destroyed) {
              outputStream.destroy(err)
            }
            reject(new Error(`FFmpeg error: ${err.message}\nCommand output: ${commandOutput}`))
          })
          .on('end', () => {
            console.log('Advanced subtitle FFmpeg process ended successfully')
            ffmpegCompleted = true
            
            // End stream immediately - pipe should handle this but we force it
            setImmediate(() => {
              if (!outputStream.writableEnded) {
                outputStream.end()
              }
            })
            
            // Fallback timeout in case setImmediate doesn't work
            streamTimeout = setTimeout(() => {
              if (!outputStream.writableEnded) {
                console.warn('⚠️ Forcing stream end after timeout')
                outputStream.end()
              }
            }, 100) // 100ms fallback
            
            this.cleanupTempFile(tempAssFile)
            if (fontCleanup) fontCleanup()
          })

        // Pipe with explicit error handling
        ffmpegCommand.pipe(outputStream, { end: true })
        
        outputStream.on('finish', () => {
          if (streamTimeout) clearTimeout(streamTimeout)
          console.log('✅ Output stream finished')
        })
        
        outputStream.on('error', (err) => {
          if (streamTimeout) clearTimeout(streamTimeout)
          console.error('❌ Output stream error:', err)
        })

        resolve(outputStream)

      } catch (error) {
        console.error('Advanced subtitle processing error:', error)
        this.cleanupTempFile(tempAssFile)
        if (fontCleanup) fontCleanup()
        reject(error)
      }
    })
  }

  private static buildAdvancedProcessingOptions(options: VideoProcessingOptions, quality: QualityLevel = 'premium'): string[] {
    console.log(`🔧 buildAdvancedProcessingOptions called with:`, JSON.stringify(options, null, 2))
    const outputOptions = []
    const timestamp = new Date().getTime().toString()

    // Basic metadata handling
    outputOptions.push('-map_metadata', '-1')
    outputOptions.push('-fflags', '+bitexact')

    const randomTime = new Date(Math.floor(Math.random() * 1000000000000)).toISOString()
    outputOptions.push('-metadata', `title=processed_${timestamp}`)
    outputOptions.push('-metadata', `comment=modified_${timestamp.slice(-6)}`)
    outputOptions.push('-metadata', `creation_time=${randomTime}`)
    outputOptions.push('-metadata', `encoder=custom_${timestamp.slice(-4)}`)

    // Simplified video processing - only apply if specific options are provided
    const videoFilters = []
    
    // Speed adjustment (setpts must come first)
    if (options?.speedFactor && options.speedFactor !== 1) {
      const ptsValue = 1 / options.speedFactor
      videoFilters.push(`setpts=${ptsValue}*PTS`)
    }
    
    // Horizontal flip
    if (options?.visibleChanges?.horizontalFlip) {
      videoFilters.push('hflip')
    }
    
    // Zoom/Scale
    if (options?.zoomFactor && options.zoomFactor !== 1) {
      videoFilters.push(`scale=iw*${options.zoomFactor}:ih*${options.zoomFactor}`)
    }
    
    // Rotation
    if (options?.rotation && options.rotation !== 0) {
      // Convert degrees to radians: radians = degrees * PI / 180
      const radians = options.rotation * Math.PI / 180
      // Rotate with black fill (standard approach)
      videoFilters.push(`rotate=${radians}:c=black`)
      // Crop to remove black edges - crop proportional to rotation
      const cropPercent = Math.min(Math.abs(options.rotation) * 1.5, 12) // Max 12% crop per side
      const keepPercent = (100 - cropPercent * 2) / 100
      videoFilters.push(`crop=iw*${keepPercent}:ih*${keepPercent}`)
    }
    
    // Saturation using hue filter
    if (options?.saturationFactor && options.saturationFactor !== 1) {
      videoFilters.push(`hue=s=${options.saturationFactor}`)
    }
    
    // Combine eq filters (brightness, contrast, lightness) into one
    const eqParts = []
    if (options?.brightness && options.brightness !== 0) {
      eqParts.push(`brightness=${options.brightness}`)
    }
    if (options?.contrast && options.contrast !== 1) {
      eqParts.push(`contrast=${options.contrast}`)
    }
    // Lightness affects gamma - map -0.5 to 0.5 range to 0.5 to 1.5 gamma range
    if (options?.lightness && options.lightness !== 0) {
      const gamma = 1 - options.lightness  // lightness -0.5 -> gamma 1.5 (darker), lightness 0.5 -> gamma 0.5 (lighter)
      eqParts.push(`gamma=${gamma}`)
    }
    if (eqParts.length > 0) {
      videoFilters.push(`eq=${eqParts.join(':')}`)
    }
    
    // Blur
    if (options?.blur && options.blur > 0) {
      // Use boxblur filter: boxblur=luma_radius:luma_power
      const blurRadius = Math.min(options.blur, 10)
      videoFilters.push(`boxblur=${blurRadius}:1`)
    }
    
    // Sharpen
    if (options?.sharpen && options.sharpen > 0) {
      // Use unsharp filter: unsharp=luma_msize_x:luma_msize_y:luma_amount
      const sharpenAmount = options.sharpen / 5 // Scale to 0-2 range
      videoFilters.push(`unsharp=5:5:${sharpenAmount}:5:5:0`)
    }

    // Anti-detection effects
    if (options?.antiDetection?.pixelShift) {
      // Shift pixels slightly
      videoFilters.push('crop=in_w-2:in_h-2:1:1')
    }
    
    if (options?.antiDetection?.microCrop) {
      // Apply subtle cropping from edges
      videoFilters.push('crop=in_w-4:in_h-4:2:2')
    }
    
    if (options?.antiDetection?.noiseAddition) {
      // Add imperceptible noise
      videoFilters.push('noise=alls=1:allf=t')
    }
    
    if (options?.antiDetection?.subtleRotation) {
      // Apply very subtle rotation (0.1 degrees) with no fill color
      videoFilters.push('rotate=0.1*PI/180:c=none')
    }

    // Add custom Handle / Watermark
    // @ts-ignore
    if (options?.addHandle) {
      // @ts-ignore
      const handleText = options.addHandle.replace(/:/g, '\\:').replace(/'/g, "\\'")
      // @ts-ignore
      const hx = options.handleX !== undefined ? options.handleX : 50
      // @ts-ignore
      const hy = options.handleY !== undefined ? options.handleY : 85
      
      let fontParam = ''
      try {
        // Import inside or use existing if getFontFilePath is in scope
        // It is imported at the top of the file
        const defaultFontPath = getFontFilePath('Arial')
        if (defaultFontPath) {
          // ffmpeg needs escaped colons and backslashes for paths in drawtext
          const escapedPath = defaultFontPath.replace(/\\/g, '/').replace(/:/g, '\\\\:')
          fontParam = `fontfile='${escapedPath}':`
        }
      } catch (e) {}
      
      // Use standard drawtext (white text, subtle shadow, semi-transparent background box)
      videoFilters.push(`drawtext=${fontParam}text='${handleText}':fontcolor=white:fontsize=(h/25):x=(w-tw)*${hx}/100:y=(h-th)*${hy}/100:shadowcolor=black@0.8:shadowx=2:shadowy=2:box=1:boxcolor=black@0.4:boxborderw=5`)
    }

    // White border - MUST BE LAST (applied after all transformations and anti-detection)
    // This ensures the border remains clean and unaffected by blur, rotation, noise, etc.
    // Note: This will be applied to the video BEFORE subtitles are overlaid
    // @ts-ignore - whiteBorder options may not be in type yet
    if (options?.enableWhiteBorder) {
      // @ts-ignore
      const leftRightPercent = options.whiteBorderLeftRight || 10
      // @ts-ignore
      const topBottomPercent = options.whiteBorderTopBottom || 20
      const visibleWidthPercent = 100 - leftRightPercent
      const visibleHeightPercent = 100 - topBottomPercent
      
      // Scale down the video and pad with white
      videoFilters.push(`scale=iw*${visibleWidthPercent / 100}:ih*${visibleHeightPercent / 100}`)
      videoFilters.push(`pad=iw/${visibleWidthPercent / 100}:ih/${visibleHeightPercent / 100}:(ow-iw)/2:(oh-ih)/2:white`)
      console.log(`🎨 White border (applied last): ${leftRightPercent}% L/R, ${topBottomPercent}% T/B`)
    }

    // Apply video filters if any exist
    if (videoFilters.length > 0) {
      console.log(`🎬 Video filters generated: ${videoFilters.join(', ')}`)
      outputOptions.push('-vf', videoFilters.join(','))
    } else {
      console.log(`⚠️ No video filters generated`)
    }

    // Simplified audio processing
    const audioFilters = []
    
    // Speed adjustment for audio (if video speed was changed)
    if (options?.speedFactor && options.speedFactor !== 1) {
      audioFilters.push(`atempo=${options.speedFactor}`)
    }
    
    if (options?.audioPitch && options.audioPitch !== 1) {
      audioFilters.push(`asetrate=44100*${options.audioPitch},aresample=44100`)
    }
    
    if (options?.audioTempoMod?.tempoFactor && options.audioTempoMod.tempoFactor !== 1) {
      audioFilters.push(`atempo=${options.audioTempoMod.tempoFactor}`)
    }

    // Apply audio filters if any exist
    if (audioFilters.length > 0) {
      outputOptions.push('-af', audioFilters.join(','))
    }

    // Use TEXT quality config for crisp subtitle rendering
    // (fast presets cause text to look blurry/blocky)
    const qualityConfig = getTextQualityConfig()
    const qualityOptions = configToOutputOptions(qualityConfig)
    outputOptions.push(...qualityOptions)
    outputOptions.push('-threads', optimalThreads)  // Override threads for subtitle processing
    
    console.log(`🎥 Using TEXT quality for crisp subtitles: CRF ${qualityConfig.crf}, preset ${qualityConfig.preset}, tune ${qualityConfig.tune}`)

    return outputOptions
  }

  private static cleanupTempFile(tempFile: string | null): void {
    if (tempFile) {
      try {
        unlinkSync(tempFile)
      } catch (error) {
        console.warn('Failed to cleanup temp file:', tempFile, error)
      }
    }
  }
} 