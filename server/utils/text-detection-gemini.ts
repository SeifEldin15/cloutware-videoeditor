import fs from 'fs/promises'
import path from 'path'
import sharp from 'sharp'

export interface GeminiWord {
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
 * Detect text in an image using Gemini Vision API.
 * Drop-in replacement for detectTextTesseract — returns the same shape.
 *
 * Bounding boxes returned by Gemini are normalized 0–1000; this function
 * converts them to absolute pixel coordinates matching the source image size.
 */
export async function detectTextGemini(
  imagePath: string,
  _language: string = 'eng'
): Promise<{ words: GeminiWord[]; fullText: string }> {
  const GEMINI_API_KEY = process.env.GEMINI_API_KEY
  if (!GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY env var is not set')
  }

  const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`

  const imageBuffer = await fs.readFile(imagePath)
  const base64Image = imageBuffer.toString('base64')

  const ext = path.extname(imagePath).slice(1).toLowerCase()
  const mimeType = ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg' : 'image/png'

  // Resolve image dimensions so we can convert normalised coords → pixels
  const metadata = await sharp(imagePath).metadata()
  const imgWidth = metadata.width ?? 1000
  const imgHeight = metadata.height ?? 1000

  const prompt = `You are an OCR system. Extract ALL text visible in this image.
Return ONLY a valid JSON array with no markdown, no code block. Each element:
{"text":"the text","x0":0-1000,"y0":0-1000,"x1":0-1000,"y1":0-1000}
x0/y0 = top-left corner, x1/y1 = bottom-right corner. Coordinates are normalised 0–1000.
Group words that appear on the same visual line into one item.
Return [] if no text is found.`

  const response = await fetch(GEMINI_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [
        {
          parts: [
            { inline_data: { mime_type: mimeType, data: base64Image } },
            { text: prompt }
          ]
        }
      ],
      generationConfig: {
        response_mime_type: 'application/json',
        temperature: 0,
        maxOutputTokens: 2048
      }
    })
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Gemini Vision API error: ${response.status} – ${errorText}`)
  }

  const result = await response.json()
  const content: string = result.candidates?.[0]?.content?.parts?.[0]?.text ?? ''

  if (!content.trim()) {
    return { words: [], fullText: '' }
  }

  try {
    let parsed: Array<{ text: string; x0: number; y0: number; x1: number; y1: number }>

    // Attempt direct parse first, then fall back to extracting a JSON array from prose
    try {
      parsed = JSON.parse(content)
    } catch {
      const jsonMatch = content.match(/\[[\s\S]*\]/)
      if (!jsonMatch) return { words: [], fullText: '' }
      parsed = JSON.parse(jsonMatch[0])
    }

    if (!Array.isArray(parsed)) return { words: [], fullText: '' }

    const words: GeminiWord[] = parsed
      .filter(item => typeof item.text === 'string' && item.text.trim().length > 0)
      .map(item => ({
        text: item.text.trim(),
        // Gemini doesn't expose per-region confidence; use a high fixed value
        confidence: 95,
        boundingBox: {
          x0: Math.round((item.x0 / 1000) * imgWidth),
          y0: Math.round((item.y0 / 1000) * imgHeight),
          x1: Math.round((item.x1 / 1000) * imgWidth),
          y1: Math.round((item.y1 / 1000) * imgHeight)
        }
      }))

    const fullText = words.map(w => w.text).join('\n')
    return { words, fullText }
  } catch (err) {
    console.error('❌ Failed to parse Gemini OCR response:', content.substring(0, 300), err)
    return { words: [], fullText: '' }
  }
}
