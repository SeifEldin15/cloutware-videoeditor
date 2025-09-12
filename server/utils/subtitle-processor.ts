import { PassThrough } from 'stream'
import ffmpeg from './ffmpeg'
import os from 'os'
import { writeFileSync, unlinkSync, existsSync, copyFileSync, mkdirSync, rmSync, statSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'
import { processVideoWithSubtitlesFile } from './captioning'
import { generateAdvancedASSFile, parseSRT, getStyleFont, getFontFilePath, type SubtitleSegment, type GirlbossStyle, processWordModeSegments, formatTimeForSRT } from './subtitleUtils'
import type { CaptionOptions, VideoProcessingOptions } from './validation-schemas'
import { resolve, join as pathJoin } from 'path'

const availableCpuCores = os.cpus().length
const optimalThreads = Math.max(2, Math.floor(availableCpuCores * 0.75))

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
  // Universal color option
  fontColor?: string
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
  static async processBasic(url: string, caption: CaptionOptions): Promise<PassThrough> {
    console.log(`[SubtitleProcessor] Starting basic processing for URL: ${url}`)
    
    if (!caption?.srtContent) {
      throw new Error('SRT content is required for basic subtitle processing')
    }

    console.log(`[SubtitleProcessor] Basic processing - SRT content length: ${caption.srtContent.length} characters`)

    let srtContent = caption.srtContent;

    // Apply word mode processing for basic subtitles if specified
    if (caption.wordMode && caption.wordMode !== 'normal') {
      console.log(`[SubtitleProcessor] 🔀 Processing basic subtitles in ${caption.wordMode} word mode with ${caption.wordsPerGroup || 1} words per group`)
      
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
      
      console.log(`[SubtitleProcessor] 📝 Generated ${wordSegments.length} word-level segments for basic processing`)
    }

    console.log(`[SubtitleProcessor] Calling processVideoWithSubtitlesFile...`)
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
    videoOptions?: VideoProcessingOptions
  ): Promise<PassThrough> {
    console.log(`[SubtitleProcessor] Starting advanced processing for URL: ${url}`)
    
    if (!caption?.srtContent) {
      throw new Error('SRT content is required for advanced subtitle processing')
    }

    console.log(`[SubtitleProcessor] Advanced processing - SRT content length: ${caption.srtContent.length} characters`)
    console.log(`[SubtitleProcessor] Subtitle style: ${caption.subtitleStyle || 'basic'}`)

    const styleOptions = this.buildStyleOptions(caption)
    console.log(`[SubtitleProcessor] Built style options:`, styleOptions)
    
    return this.processVideoWithAdvancedSubtitles(
      url,
      caption.srtContent,
      styleOptions,
      videoOptions
    )
  }

  private static buildStyleOptions(caption: CaptionOptions): StyleOptions {
    // Get the style-specific font
    const styleFont = getStyleFont(caption?.subtitleStyle || 'basic', caption?.fontFamily);
    
    return {
      fontSize: caption?.fontSize,
      fontFamily: styleFont,
      textAlign: caption?.horizontalAlignment,
      subtitleStyle: caption?.subtitleStyle,
      // Universal color option
      fontColor: caption?.fontColor,
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
  }

  private static async processVideoWithAdvancedSubtitles(
    inputUrl: string,
    srtContent: string,
    styleOptions: StyleOptions,
    videoOptions?: VideoProcessingOptions
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
          // Create a temporary fonts directory
          fontsDir = pathJoin(tmpdir(), 'fonts_' + Date.now())
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
            shadowStrength: styleOptions.shadowStrength || 1.5,
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
            shadowStrength: styleOptions.shadowStrength || 1.5,
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
            shadowStrength: styleOptions.shadowStrength || 1.5,
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
          console.log(`✨ Setting up ThinToBold with font: ${styleOptions.fontFamily} -> ${styleOptions.fontFamily}`)
          const thinToBoldStyle: GirlbossStyle & {
            fontSize?: number
            fontFamily?: string
            fontFilePath?: string
            textAlign?: string
            outlineWidth?: number
            outlineColor?: string
            outlineBlur?: number
          } = {
            color: styleOptions.thinToBoldColor || '#FFFFFF',
            shadowStrength: styleOptions.shadowStrength || 1.5,
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
          console.log(`📉 Setting up ShrinkingPairs with font: ${styleOptions.fontFamily} -> ${styleOptions.fontFamily}`)
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
          } = {
            color: styleOptions.shrinkingPairsColor || '#0BF431',
            shadowStrength: styleOptions.shadowStrength || 1.5,
            animation: styleOptions.animation === 'shake' ? 'shake' : 'none',
            verticalPosition: styleOptions.verticalPosition || 15,
            fontSize: styleOptions.fontSize || 50,
            fontFamily: styleOptions.fontFamily || 'Arial',
            fontFilePath: fontFile || styleOptions.fontFamily || 'Arial',
            textAlign: styleOptions.textAlign || 'center',
            textOutlineWidth: styleOptions.outlineWidth || 2,
            outlineWidth: styleOptions.outlineWidth || 2,
            outlineColor: styleOptions.outlineColor || '#000000',
            outlineBlur: styleOptions.outlineBlur || 0
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
            shadowStrength: styleOptions.shadowStrength || 1.5,
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
          console.log(`📝 Setting up WhiteImpact with font: ${styleOptions.fontFamily} -> ${styleOptions.fontFamily}`)
          const whiteImpactStyle: GirlbossStyle & {
            fontSize?: number
            fontFamily?: string
            fontFilePath?: string
            textAlign?: string
            color?: string
            outlineWidth?: number
            outlineColor?: string
            outlineBlur?: number
          } = {
            color: styleOptions.fontColor || '#FFFFFF',
            shadowStrength: styleOptions.shadowStrength || 2.0,
            animation: 'none',
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
          console.log(`📰 Setting up ImpactFull with font: ${styleOptions.fontFamily} -> ${styleOptions.fontFamily}`)
          const impactFullStyle: GirlbossStyle & {
            fontSize?: number
            fontFamily?: string
            fontFilePath?: string
            textAlign?: string
            color?: string
            outlineWidth?: number
            outlineColor?: string
            outlineBlur?: number
          } = {
            color: styleOptions.fontColor || '#FFFFFF',
            shadowStrength: styleOptions.shadowStrength || 2.0,
            animation: 'none',
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

        } else if (styleOptions.subtitleStyle === 'basic') {
          console.log(`⚡ Setting up Basic style with font: ${styleOptions.fontFamily} -> ${styleOptions.fontFamily}`)
          const basicStyle: GirlbossStyle & {
            fontSize?: number
            fontFamily?: string
            fontFilePath?: string
            textAlign?: string
            color?: string
            outlineWidth?: number
            outlineColor?: string
            outlineBlur?: number
          } = {
            color: styleOptions.fontColor || '#FFFFFF',
            shadowStrength: 1.0,
            animation: 'none',
            verticalPosition: styleOptions.verticalPosition || 35,
            fontSize: styleOptions.fontSize || 32,
            fontFamily: styleOptions.fontFamily || 'Arial',
            fontFilePath: fontFile || styleOptions.fontFamily || 'Arial',
            textAlign: styleOptions.textAlign || 'center',
            outlineWidth: styleOptions.outlineWidth || 3,
            outlineColor: styleOptions.outlineColor || '#000000',
            outlineBlur: styleOptions.outlineBlur || 0
          }
          assContent = generateAdvancedASSFile(subtitleSegments, basicStyle, 'basic')

        } else {
          console.warn(`⚠️  Unknown subtitle style: ${styleOptions.subtitleStyle}, falling back to basic style`)
          const fallbackStyle: GirlbossStyle & {
            fontSize?: number
            fontFamily?: string
            fontFilePath?: string
            textAlign?: string
            color?: string
            outlineWidth?: number
            outlineColor?: string
            outlineBlur?: number
          } = {
            color: '#FFFFFF',
            shadowStrength: 1.0,
            animation: 'none',
            verticalPosition: 35,
            fontSize: 32,
            fontFamily: 'Arial',
            fontFilePath: 'Arial',
            textAlign: 'center',
            outlineWidth: 3,
            outlineColor: '#000000',
            outlineBlur: 0
          }
          assContent = generateAdvancedASSFile(subtitleSegments, fallbackStyle, 'basic')
        }

        tempAssFile = join(tmpdir(), `subtitle_${Date.now()}.ass`)
        writeFileSync(tempAssFile, assContent)
        
        console.log(`[SubtitleProcessor] ASS file created at: ${tempAssFile}`)
        
        // Check file size using fs import (already imported at top)
        let fileSize = 'FILE NOT FOUND'
        try {
          if (existsSync(tempAssFile)) {
            const stats = statSync(tempAssFile)
            fileSize = `${stats.size} bytes`
          }
        } catch (error) {
          fileSize = 'Error reading file'
        }
        
        console.log(`[SubtitleProcessor] ASS file size: ${fileSize}`)
        console.log(`[SubtitleProcessor] ASS content preview (first 500 chars):`)
        console.log(assContent.substring(0, 500))

        const outputStream = new PassThrough({ highWaterMark: 4 * 1024 * 1024 })
        let totalBytesWritten = 0

        // Track data flowing through the stream
        outputStream.on('data', (chunk) => {
          totalBytesWritten += chunk.length
          if (totalBytesWritten % (1024 * 1024) === 0) { // Log every MB
            console.log(`[SubtitleProcessor] Written ${(totalBytesWritten / 1024 / 1024).toFixed(2)}MB to output stream`)
          }
        })

        outputStream.on('end', () => {
          console.log(`[SubtitleProcessor] Output stream ended. Total bytes: ${totalBytesWritten}`)
          if (totalBytesWritten === 0) {
            console.error('[SubtitleProcessor] WARNING: No data was written to output stream!')
          }
        })

        let commandOutput = ''
        const ffmpegCommand = ffmpeg(inputUrl)

        // Using system fonts now for compatibility

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

        const advancedOptions = videoOptions ? this.buildAdvancedProcessingOptions(videoOptions) : []

        let baseVideoFilter = ''
        const vfIndex = advancedOptions.findIndex(opt => opt === '-vf')
        if (vfIndex !== -1 && vfIndex + 1 < advancedOptions.length) {
          baseVideoFilter = advancedOptions[vfIndex + 1]
        }

        const escapedPath = tempAssFile.replace(/\\/g, '/').replace(/:/g, '\\:')
        const escapedFontsDir = fontsDir ? fontsDir.replace(/\\/g, '/').replace(/:/g, '\\:') : null
        const subtitleFilter = escapedFontsDir 
          ? `subtitles='${escapedPath}':fontsdir='${escapedFontsDir}'`
          : `subtitles='${escapedPath}'`
        
        console.log(`[SubtitleProcessor] Using subtitle filter: ${subtitleFilter}`)
        console.log(`[SubtitleProcessor] Original path: ${tempAssFile}`)
        console.log(`[SubtitleProcessor] Escaped path: ${escapedPath}`)
        console.log(`[SubtitleProcessor] Fonts dir: ${fontsDir || 'none'}`)
        console.log(`[SubtitleProcessor] ASS file exists: ${existsSync(tempAssFile)}`)
        console.log(`[SubtitleProcessor] Base video filter: ${baseVideoFilter || 'none'}`)

        // Check for problematic filter combinations that cause segfaults
        let videoFilter = subtitleFilter
        if (baseVideoFilter) {
          const isProblematicCombination = this.hasProblematicFilterCombination(baseVideoFilter)
          if (isProblematicCombination) {
            console.log(`[SubtitleProcessor] WARNING: Detected problematic filter combination, using safe fallback`)
            console.log(`[SubtitleProcessor] Problematic base filter: ${baseVideoFilter}`)
            // Use safe fallback - apply a simplified version of anti-detection filters
            const safeBaseFilter = this.createSafeVideoFilter(baseVideoFilter)
            videoFilter = safeBaseFilter ? `${safeBaseFilter},${subtitleFilter}` : subtitleFilter
          } else {
            videoFilter = `${baseVideoFilter},${subtitleFilter}`
          }
        }

        console.log(`[SubtitleProcessor] Final video filter: ${videoFilter}`)

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
          outputOptions.push('-c:v', 'libx264', '-preset', 'veryfast', '-crf', '23', '-c:a', 'aac', '-b:a', '128k')
        }

        // Use safer output format options to avoid segfaults
        outputOptions.push('-threads', optimalThreads.toString(), '-pix_fmt', 'yuv420p')
        
        // Add error resilience options
        outputOptions.push('-err_detect', 'ignore_err')
        outputOptions.push('-fflags', '+genpts')
        
        outputOptions.push('-f', 'mpegts')

        ffmpegCommand.outputOptions(outputOptions)
          .on('start', (commandLine: string) => {
            console.log('[SubtitleProcessor] Advanced subtitle FFmpeg started:', commandLine)
          })
          .on('progress', (progress: any) => {
            if (progress.percent) {
              console.log(`[SubtitleProcessor] Advanced subtitle processing: ${progress.percent.toFixed(2)}%`)
            }
          })
          .on('stderr', (stderrLine: string) => {
            commandOutput += stderrLine + '\n'
            console.log('[SubtitleProcessor] Advanced subtitle FFmpeg stderr:', stderrLine)
            
            // Check for specific errors
            if (stderrLine.includes('No such file or directory')) {
              console.error('[SubtitleProcessor] ERROR: FFmpeg cannot find subtitle file!')
            }
            if (stderrLine.includes('Invalid data found')) {
              console.error('[SubtitleProcessor] ERROR: Invalid subtitle file format!')
            }
          })
          .on('error', (err: Error) => {
            console.error('[SubtitleProcessor] Advanced subtitle FFmpeg error:', err)
            console.error('[SubtitleProcessor] Error message details:', err.message)
            console.error('[SubtitleProcessor] Error type:', typeof err.message)
            console.error('[SubtitleProcessor] Command output:', commandOutput)
            console.error('[SubtitleProcessor] ASS file exists at error:', tempAssFile ? existsSync(tempAssFile) : 'tempAssFile is null')
            
            // Check if this is a segmentation fault
            if (err.message.includes('SIGSEGV') || 
                err.message.includes('segmentation fault') || 
                err.message.includes('killed with signal SIGSEGV')) {
              console.log('[SubtitleProcessor] Segmentation fault detected, attempting fallback processing...')
              
              // Try with a simpler command (subtitles only, no other filters)
              if (tempAssFile) {
                this.processWithSimpleFallback(inputUrl, tempAssFile, outputStream)
                  .then(() => {
                    console.log('[SubtitleProcessor] Fallback processing succeeded')
                    this.cleanupTempFile(tempAssFile)
                    if (fontCleanup) fontCleanup()
                    resolve()
                  })
                  .catch((fallbackError: Error) => {
                    console.error('[SubtitleProcessor] Fallback processing also failed:', fallbackError)
                    this.cleanupTempFile(tempAssFile)
                    if (fontCleanup) fontCleanup()
                    reject(new Error(`FFmpeg segmentation fault and fallback failed: ${err.message}`))
                  })
                return
              }
            }
            
            this.cleanupTempFile(tempAssFile)
            if (fontCleanup) fontCleanup()
            reject(new Error(`FFmpeg error: ${err.message}\nCommand output: ${commandOutput}`))
          })
          .on('end', () => {
            console.log('[SubtitleProcessor] Advanced subtitle FFmpeg process ended')
            this.cleanupTempFile(tempAssFile)
            if (fontCleanup) fontCleanup()
          })

        ffmpegCommand.pipe(outputStream, { end: true })

        resolve(outputStream)

      } catch (error) {
        console.error('Advanced subtitle processing error:', error)
        this.cleanupTempFile(tempAssFile)
        if (fontCleanup) fontCleanup()
        reject(error)
      }
    })
  }

  private static hasProblematicFilterCombination(baseVideoFilter: string): boolean {
    if (!baseVideoFilter) return false
    
    // Check for combinations that commonly cause segfaults with subtitles
    const problematicPatterns = [
      // Crop + rotate + subtitles combination is known to cause segfaults
      /crop=.*,.*rotate=.*PI/,
      // Complex rotation with subtitles
      /rotate=.*PI.*180/,
      // Multiple geometric transformations
      /crop=.*,.*rotate=.*,.*scale=/,
      // Anti-detection filters with complex transformations
      /crop=in_w-\d+:in_h-\d+.*rotate=.*PI/
    ]
    
    for (const pattern of problematicPatterns) {
      if (pattern.test(baseVideoFilter)) {
        console.log(`[SubtitleProcessor] Detected problematic pattern: ${pattern.source}`)
        return true
      }
    }
    
    return false
  }

  private static createSafeVideoFilter(problematicFilter: string): string {
    console.log(`[SubtitleProcessor] Creating safe filter from: ${problematicFilter}`)
    
    // Extract safe components and avoid problematic combinations
    const parts = problematicFilter.split(',')
    const safeFilters: string[] = []
    
    for (const part of parts) {
      const trimmedPart = part.trim()
      
      // Skip problematic combinations
      if (trimmedPart.includes('crop=in_w-') && trimmedPart.includes('rotate=')) {
        console.log(`[SubtitleProcessor] Skipping problematic crop+rotate: ${trimmedPart}`)
        continue
      }
      
      // Allow safe individual filters
      if (trimmedPart.startsWith('scale=') && !trimmedPart.includes('PI')) {
        safeFilters.push(trimmedPart)
      } else if (trimmedPart.includes('format=')) {
        safeFilters.push(trimmedPart)
      } else if (trimmedPart.includes('fps=')) {
        safeFilters.push(trimmedPart)
      }
      // Skip crop and rotate filters that are known to cause issues with subtitles
    }
    
    const safeFilter = safeFilters.join(',')
    console.log(`[SubtitleProcessor] Safe filter created: ${safeFilter || 'none'}`)
    return safeFilter
  }

  private static async processWithSimpleFallback(
    inputUrl: string, 
    tempAssFile: string, 
    outputStream: PassThrough
  ): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      console.log('[SubtitleProcessor] Starting simple fallback processing (basic SRT subtitles)')
      
      // Create a simple SRT file instead of using the complex ASS file
      const simpleSrtPath = tempAssFile.replace('.ass', '_fallback.srt')
      const basicSrtContent = `1
00:00:00,000 --> 00:00:05,000
Fallback subtitle processing active

2
00:00:05,000 --> 00:00:10,000
Complex filters caused segmentation fault`

      try {
        writeFileSync(simpleSrtPath, basicSrtContent)
        console.log('[SubtitleProcessor] Created fallback SRT file:', simpleSrtPath)
      } catch (err) {
        console.error('[SubtitleProcessor] Failed to create fallback SRT:', err)
        return reject(err)
      }
      
      const fallbackCommand = ffmpeg(inputUrl)
      let fallbackOutput = ''
      
      fallbackCommand.inputOptions([
        '-protocol_whitelist', 'file,http,https,tcp,tls',
        '-reconnect', '1',
        '-reconnect_streamed', '1',
        '-analyzeduration', '10000000',
        '-probesize', '10000000',
        '-thread_queue_size', '512',
        '-threads', optimalThreads.toString()
      ])
      
      // Use basic SRT subtitles instead of complex ASS
      const escapedSrtPath = simpleSrtPath.replace(/\\/g, '/').replace(/:/g, '\\:')
      
      fallbackCommand
        .outputOptions([
          '-vf', `subtitles='${escapedSrtPath}'`,
          '-c:v', 'libx264',
          '-preset', 'ultrafast',
          '-crf', '28', // Lower quality for faster processing
          '-c:a', 'aac',
          '-b:a', '128k',
          '-threads', optimalThreads.toString(),
          '-pix_fmt', 'yuv420p',
          '-err_detect', 'ignore_err',
          '-f', 'mpegts'
        ])
      
      fallbackCommand
        .on('start', (commandLine: string) => {
          console.log('[SubtitleProcessor] Fallback FFmpeg started:', commandLine)
        })
        .on('stderr', (stderrLine: string) => {
          fallbackOutput += stderrLine + '\n'
          console.log('[SubtitleProcessor] Fallback FFmpeg stderr:', stderrLine)
        })
        .on('error', (err: Error) => {
          console.error('[SubtitleProcessor] Fallback FFmpeg error:', err)
          // Clean up the fallback SRT file
          try {
            unlinkSync(simpleSrtPath)
          } catch {}
          reject(err)
        })
        .on('end', () => {
          console.log('[SubtitleProcessor] Fallback FFmpeg process ended successfully')
          // Clean up the fallback SRT file
          try {
            unlinkSync(simpleSrtPath)
          } catch {}
          resolve()
        })
      
      // Use writeToStream() method
      fallbackCommand.writeToStream(outputStream, { end: true })
    })
  }

  private static buildAdvancedProcessingOptions(options: VideoProcessingOptions): string[] {
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
    
    if (options?.speedFactor && options.speedFactor !== 1) {
      const ptsValue = 1 / options.speedFactor
      videoFilters.push(`setpts=${ptsValue}*PTS`)
    }
    
    if (options?.zoomFactor && options.zoomFactor !== 1) {
      videoFilters.push(`scale=iw*${options.zoomFactor}:ih*${options.zoomFactor}`)
    }
    
    if (options?.saturationFactor && options.saturationFactor !== 1) {
      videoFilters.push(`hue=s=${options.saturationFactor}`)
    }
    
    if (options?.lightness && options.lightness !== 0) {
      videoFilters.push(`eq=brightness=${options.lightness}`)
    }

    // Anti-detection effects (simplified)
    if (options?.antiDetection?.pixelShift) {
      videoFilters.push('crop=in_w-2:in_h-2:1:1')
    }
    
    // Noise filter disabled - not compatible with current FFmpeg version
    // if (options?.antiDetection?.noiseAddition) {
    //   videoFilters.push('noise=alls=1:allf=t')
    // }
    
    if (options?.antiDetection?.subtleRotation) {
      videoFilters.push('rotate=0.1*PI/180')
    }

    // Apply video filters if any exist
    if (videoFilters.length > 0) {
      outputOptions.push('-vf', videoFilters.join(','))
    }

    // Simplified audio processing
    const audioFilters = []
    
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

    // High-quality encoding options for subtitles
    outputOptions.push('-c:v', 'libx264')
    outputOptions.push('-preset', 'medium')  // Better quality for subtitle processing
    outputOptions.push('-crf', '20')        // Higher quality for subtitle text clarity
    outputOptions.push('-threads', optimalThreads)
    outputOptions.push('-pix_fmt', 'yuv420p')
    outputOptions.push('-profile:v', 'high')
    outputOptions.push('-c:a', 'aac')
    outputOptions.push('-b:a', '192k')      // Higher audio bitrate
    outputOptions.push('-ar', '48000')      // Professional audio sample rate
    outputOptions.push('-max_muxing_queue_size', '4096')
    outputOptions.push('-movflags', '+faststart')

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