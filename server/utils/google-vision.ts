import { google } from 'googleapis'
import { GoogleAuth } from 'google-auth-library'
import fs from 'fs/promises'

const vision = google.vision('v1')
const auth = new GoogleAuth({
  scopes: ['https://www.googleapis.com/auth/cloud-vision']
})

export interface GoogleVisionWord {
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
 * Detect text in an image using Google Cloud Vision API
 * Returns an array of words with their bounding boxes and full text
 */
export async function detectTextGoogle(imagePath: string, languageHint?: string): Promise<{ words: GoogleVisionWord[], fullText: string }> {
  try {
    const content = await fs.readFile(imagePath, { encoding: 'base64' })
    const client = await auth.getClient()

    const requestBody: any = {
      requests: [{
        image: { content },
        features: [{ type: 'TEXT_DETECTION' }]
      }]
    }

    if (languageHint) {
      requestBody.requests[0].imageContext = {
        languageHints: [languageHint]
      }
    }

    const response = await vision.images.annotate({
      auth: client as any,
      requestBody
    })

    // Access data property safely (avoiding TS errors with googleapis types)
    const data = (response as any).data
    const annotations = data.responses?.[0]
    
    if (!annotations) return { words: [], fullText: '' }

    const fullText = annotations.textAnnotations?.[0]?.description || ''
    const words: GoogleVisionWord[] = []

    // Use fullTextAnnotation to get structured word data
    const fullTextAnnotation = annotations.fullTextAnnotation
    if (fullTextAnnotation && fullTextAnnotation.pages) {
      for (const page of fullTextAnnotation.pages) {
        if (!page.blocks) continue
        for (const block of page.blocks) {
          if (!block.paragraphs) continue
          for (const paragraph of block.paragraphs) {
            if (!paragraph.words) continue
            for (const word of paragraph.words) {
              // Assemble word text from symbols
              const text = word.symbols?.map((s: any) => s.text).join('') || ''
              if (!text.trim()) continue

              // Calculate bounding box from vertices
              const vertices = word.boundingBox?.vertices || []
              if (vertices.length < 4) continue

              // Vertices are usually: top-left, top-right, bottom-right, bottom-left
              // Find min/max for simple rect
              const xCoords = vertices.map((v: any) => v.x || 0)
              const yCoords = vertices.map((v: any) => v.y || 0)

              const x0 = Math.min(...xCoords)
              const x1 = Math.max(...xCoords)
              const y0 = Math.min(...yCoords)
              const y1 = Math.max(...yCoords)

              words.push({
                text,
                confidence: (word.confidence || 1) * 100, // Google returns 0-1, Tesseract uses 0-100
                boundingBox: { x0, y0, x1, y1 }
              })
            }
          }
        }
      }
    }

    return { words, fullText }
  } catch (error) {
    console.error('❌ Google Vision API error:', error)
    // Don't crash processing, just return empty results
    return { words: [], fullText: '' }
  }
}
