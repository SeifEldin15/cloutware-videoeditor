import { createWorker } from 'tesseract.js'
import sharp from 'sharp'
import fs from 'fs/promises'
import path from 'path'

export interface TesseractWord {
  text: string
  confidence: number
  boundingBox: {
    x0: number
    y0: number
    x1: number
    y1: number
  }
}

/**
 * Detect text in an image using Tesseract.js (Open Source)
 * Returns an array of words with their bounding boxes and full text
 */
export async function detectTextTesseract(imagePath: string, language: string = 'eng'): Promise<{ words: TesseractWord[], fullText: string }> {
  let worker: any = null
  try {
    // 1. Preprocess image with Sharp for better OCR accuracy
    // This matches the "open source model" approach used before
    const ext = path.extname(imagePath)
    const processedPath = imagePath.replace(ext, `_processed${ext}`)
    
    await sharp(imagePath)
      .greyscale()
      .normalize()
      .sharpen({ sigma: 1.5 })
      .threshold(128)
      .toFile(processedPath)

    // 2. Initialize Tesseract worker
    worker = await createWorker(language)
    
    await worker.setParameters({
      tessedit_pageseg_mode: 6 as any, // Assume a single uniform block of text
      preserve_interword_spaces: '1',
    })

    // 3. Perform OCR
    const { data } = await worker.recognize(processedPath)
    
    const fullText = data.text || ''
    const words: TesseractWord[] = (data.words || []).map((w: any) => ({
      text: w.text,
      confidence: w.confidence,
      boundingBox: {
        x0: w.bbox.x0,
        y0: w.bbox.y0,
        x1: w.bbox.x1,
        y1: w.bbox.y1
      }
    }))

    // Cleanup processed image
    try {
      await fs.unlink(processedPath)
    } catch (e) {
      // Ignore cleanup error
    }

    return { words, fullText }
  } catch (error: any) {
    console.error('❌ Tesseract OCR error:', error.message || error)
    return { words: [], fullText: '' }
  } finally {
    if (worker) {
      await worker.terminate()
    }
  }
}
