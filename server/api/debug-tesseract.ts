import { createWorker } from 'tesseract.js'
import { readBody } from 'h3'
import fs from 'fs/promises'
import path from 'path'
import os from 'os'
import sharp from 'sharp'
import { getInitializedFfmpeg } from '../utils/ffmpeg'

export default eventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const { url } = body
    
    console.log('🔬 Debugging Tesseract data structure...')
    
    // Create temp dir
    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'tesseract-debug-'))
    
    try {
      // Download video
      const videoPath = path.join(tempDir, 'video.mp4')
      const response = await fetch(url)
      await fs.writeFile(videoPath, Buffer.from(await response.arrayBuffer()))
      
      // Extract one frame
      const ffmpeg = await getInitializedFfmpeg()
      const framePath = path.join(tempDir, 'frame.png')
      
      await new Promise<void>((resolve, reject) => {
        ffmpeg()
          .input(videoPath)
          .outputOptions([
            '-vf', 'select=eq(n\\,5),scale=2560:-1,eq=contrast=1.5:brightness=0.1',
            '-frames:v', '1'
          ])
          .output(framePath)
          .on('end', () => resolve())
          .on('error', reject)
          .run()
      })
      
      // Preprocess
      const processedPath = path.join(tempDir, 'processed.png')
      await sharp(framePath)
        .greyscale()
        .normalize()
        .sharpen({ sigma: 1.5 })
        .threshold(128)
        .toFile(processedPath)
      
      // Run Tesseract
      const worker = await createWorker('eng')
      await worker.setParameters({
        tessedit_pageseg_mode: 6 as any,
        preserve_interword_spaces: '1',
      })
      
      // Try to get detailed data with outputFormats
      const result = await worker.recognize(processedPath, {}, { text: true, blocks: true, hocr: false, tsv: true })
      const data = result.data
      
      await worker.terminate()
      
      // Return full data structure
      return {
        success: true,
        debug: {
          confidence: data.confidence,
          text: data.text,
          tsvLength: data.tsv?.length || 0,
          tsvFirstLines: data.tsv?.split('\n').slice(0, 5) || [],
          dataKeys: Object.keys(data),
          hasParagraphs: 'paragraphs' in data,
          hasLines: 'lines' in data,
          hasWords: 'words' in data,
          hasBlocks: 'blocks' in data,
          paragraphsType: typeof (data as any).paragraphs,
          paragraphsLength: (data as any).paragraphs?.length || 0,
          linesType: typeof (data as any).lines,
          linesLength: (data as any).lines?.length || 0,
          wordsType: typeof (data as any).words,
          wordsLength: (data as any).words?.length || 0,
          blocksType: typeof (data as any).blocks,
          blocksLength: (data as any).blocks?.length || 0,
          sampleParagraph: (data as any).paragraphs?.[0] ? {
            text: (data as any).paragraphs[0].text,
            hasLines: 'lines' in (data as any).paragraphs[0],
            linesCount: (data as any).paragraphs[0].lines?.length || 0
          } : null,
          sampleLine: (data as any).lines?.[0] ? {
            text: (data as any).lines[0].text,
            hasWords: 'words' in (data as any).lines[0],
            wordsCount: (data as any).lines[0].words?.length || 0
          } : null,
          sampleWord: (data as any).words?.[0] || null,
          blocksDetail: (data as any).blocks?.map((b: any) => ({
            text: b.text,
            hasParagraphs: 'paragraphs' in b,
            paragraphsCount: b.paragraphs?.length || 0,
            firstParagraph: b.paragraphs?.[0] ? {
              text: b.paragraphs[0].text,
              linesCount: b.paragraphs[0].lines?.length || 0,
              firstLine: b.paragraphs[0].lines?.[0] ? {
                text: b.paragraphs[0].lines[0].text,
                wordsCount: b.paragraphs[0].lines[0].words?.length || 0,
                firstWord: b.paragraphs[0].lines[0].words?.[0]
              } : null
            } : null
          })) || []
        }
      }
      
    } finally {
      await fs.rm(tempDir, { recursive: true, force: true })
    }
    
  } catch (error) {
    console.error('Debug error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
})
