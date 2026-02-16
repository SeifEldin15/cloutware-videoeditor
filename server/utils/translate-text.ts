/**
 * Text translation utility using MyMemory API (free, no API key required)
 * Supports translating individual strings and batches of SRT segments.
 * 
 * Falls back gracefully — if translation fails, returns the original text.
 */

export interface TranslationResult {
  translatedText: string
  detectedSourceLanguage?: string
}

/**
 * Supported language codes for translation
 * These map to ISO 639-1 codes used by MyMemory and ElevenLabs
 */
export const TRANSLATION_LANGUAGES = {
  en: 'English',
  es: 'Spanish',
  fr: 'French',
  de: 'German',
  it: 'Italian',
  pt: 'Portuguese',
  nl: 'Dutch',
  pl: 'Polish',
  ru: 'Russian',
  ja: 'Japanese',
  ko: 'Korean',
  zh: 'Chinese',
  ar: 'Arabic',
  hi: 'Hindi',
  tr: 'Turkish',
  sv: 'Swedish',
  da: 'Danish',
  no: 'Norwegian',
  fi: 'Finnish',
  cs: 'Czech',
  ro: 'Romanian',
  el: 'Greek',
  hu: 'Hungarian',
  uk: 'Ukrainian',
  id: 'Indonesian',
  ms: 'Malay',
  th: 'Thai',
  vi: 'Vietnamese',
  he: 'Hebrew',
  bg: 'Bulgarian',
  hr: 'Croatian',
  sk: 'Slovak',
  sl: 'Slovenian',
  ta: 'Tamil',
  fil: 'Filipino',
} as const

export type LanguageCode = keyof typeof TRANSLATION_LANGUAGES

/**
 * Translate a single text string from one language to another
 * Uses MyMemory Translation API (free tier: 5000 chars/day without key, more with key)
 * 
 * @param text - The text to translate
 * @param sourceLang - Source language code (e.g. 'en')
 * @param targetLang - Target language code (e.g. 'es')
 * @returns The translated text
 */
export async function translateText(
  text: string,
  sourceLang: string,
  targetLang: string
): Promise<string> {
  if (!text || text.trim().length === 0) return text
  if (sourceLang === targetLang) return text

  try {
    const langPair = `${sourceLang}|${targetLang}`
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${encodeURIComponent(langPair)}`

    const response = await fetch(url)

    if (!response.ok) {
      console.warn(`[Translation] API returned ${response.status}, falling back to original text`)
      return text
    }

    const data = await response.json() as any

    if (data.responseStatus === 200 && data.responseData?.translatedText) {
      const translated = data.responseData.translatedText as string
      // MyMemory sometimes returns the original text in ALL CAPS when it can't translate
      if (translated.toUpperCase() === translated && text.toUpperCase() !== text) {
        // Likely a failed translation that returned uppercase — use original
        console.warn(`[Translation] Suspicious uppercase result, checking matches...`)
        if (translated.toLowerCase() === text.toLowerCase()) {
          return text // Same text returned, probably not translated
        }
      }
      return translated
    }

    console.warn('[Translation] Unexpected API response format:', JSON.stringify(data).substring(0, 200))
    return text
  } catch (error) {
    console.error('[Translation] Failed to translate text:', error)
    return text // Graceful fallback
  }
}

/**
 * Translate an array of text strings in batch, with rate limiting to avoid API throttling.
 * Translates sequentially with a small delay between requests.
 * 
 * @param texts - Array of strings to translate
 * @param sourceLang - Source language code
 * @param targetLang - Target language code
 * @returns Array of translated strings (same order as input)
 */
export async function translateBatch(
  texts: string[],
  sourceLang: string,
  targetLang: string
): Promise<string[]> {
  if (sourceLang === targetLang) return [...texts]

  console.log(`[Translation] Translating ${texts.length} texts from ${sourceLang} to ${targetLang}...`)

  const results: string[] = []

  for (let i = 0; i < texts.length; i++) {
    const translated = await translateText(texts[i], sourceLang, targetLang)
    results.push(translated)

    // Small delay between requests to be nice to the free API
    if (i < texts.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 100))
    }

    if ((i + 1) % 10 === 0) {
      console.log(`[Translation] Progress: ${i + 1}/${texts.length}`)
    }
  }

  console.log(`[Translation] ✅ Batch translation complete (${results.length} texts)`)
  return results
}

/**
 * Translate SRT content preserving the SRT format structure.
 * Only translates the text portions, keeping timestamps and indices intact.
 * 
 * @param srtContent - Raw SRT content string
 * @param sourceLang - Source language code (e.g. 'en')
 * @param targetLang - Target language code (e.g. 'es')
 * @returns Translated SRT content string
 */
export async function translateSrt(
  srtContent: string,
  sourceLang: string,
  targetLang: string
): Promise<string> {
  if (sourceLang === targetLang) return srtContent

  console.log(`[Translation] Translating SRT from ${sourceLang} to ${targetLang}...`)

  const normalizedContent = srtContent.replace(/\r\n/g, '\n').replace(/\r/g, '\n')
  const blocks = normalizedContent.trim().split(/\n\n+/)

  const translatedBlocks: string[] = []

  for (const block of blocks) {
    const lines = block.trim().split('\n')
    if (lines.length < 3) {
      translatedBlocks.push(block)
      continue
    }

    const indexLine = lines[0]
    const timestampLine = lines[1]
    const textLines = lines.slice(2)
    const originalText = textLines.join(' ').trim()

    if (originalText.length === 0) {
      translatedBlocks.push(block)
      continue
    }

    // Translate the text portion only
    const translatedText = await translateText(originalText, sourceLang, targetLang)

    translatedBlocks.push(`${indexLine}\n${timestampLine}\n${translatedText}`)

    // Small delay between API calls
    await new Promise(resolve => setTimeout(resolve, 80))
  }

  const result = translatedBlocks.join('\n\n')
  console.log(`[Translation] ✅ SRT translation complete`)
  return result
}
