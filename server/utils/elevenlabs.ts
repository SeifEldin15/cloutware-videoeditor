import { ElevenLabsClient } from '@elevenlabs/elevenlabs-js'
import { PassThrough } from 'node:stream'

/**
 * ElevenLabs API configuration
 */
const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY

/**
 * Lazy-loaded ElevenLabs client
 */
let client: ElevenLabsClient | null = null

function getClient(): ElevenLabsClient {
  if (!ELEVENLABS_API_KEY) {
    throw new Error('ELEVENLABS_API_KEY is not configured. Please set it in your environment variables.')
  }
  
  if (!client) {
    client = new ElevenLabsClient({
      apiKey: ELEVENLABS_API_KEY
    })
  }
  
  return client
}

/**
 * Voice settings for speech generation
 */
export interface VoiceSettings {
  voiceId?: string
  speed?: number
  stability?: number
  similarityBoost?: number
  style?: number
}

/**
 * Generate speech from text using ElevenLabs API
 * 
 * @param text - The text to convert to speech
 * @param settings - Voice and generation settings
 * @returns A readable stream containing the audio data
 */
export async function generateSpeech(
  text: string,
  settings: VoiceSettings = {}
): Promise<PassThrough> {
  const {
    voiceId = '21m00Tcm4TlvDq8ikWAM', // Default: Rachel
    speed = 1.0,
    stability = 0.5,
    similarityBoost = 0.75,
    style = 0.0
  } = settings

  console.log('[ElevenLabs] Generating speech...')
  console.log(`[ElevenLabs] Voice ID: ${voiceId}`)
  console.log(`[ElevenLabs] Text length: ${text.length} characters`)
  console.log(`[ElevenLabs] Settings: speed=${speed}, stability=${stability}, similarity=${similarityBoost}, style=${style}`)

  try {
    // Create audio stream from ElevenLabs
    const elevenLabsClient = getClient()
    const audioStream = await elevenLabsClient.textToSpeech.convert(voiceId, {
      text,
      modelId: 'eleven_multilingual_v2',
      voiceSettings: {
        stability,
        similarityBoost,
        style,
        useSpeakerBoost: true,
        // `speed` is supported by the runtime API (0.5 - 2.0). Cast to avoid
        // friction with older SDK type definitions.
        speed,
      } as any,
    })

    // Convert the ReadableStream to a Node.js stream
    const outputStream = new PassThrough()
    
    // Get reader from the stream
    ;(async () => {
      try {
        const reader = audioStream.getReader()
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          outputStream.write(Buffer.from(value))
        }
        outputStream.end()
        console.log('[ElevenLabs] ✅ Speech generation complete')
      } catch (error) {
        console.error('[ElevenLabs] ❌ Error streaming audio:', error)
        outputStream.destroy(error as Error)
      }
    })()

    return outputStream
  } catch (error: any) {
    console.error('[ElevenLabs] ❌ Failed to generate speech:', error?.message || error)
    throw new Error(`ElevenLabs API error: ${error?.message || 'Unknown error'}`)
  }
}

/**
 * Get list of available voices
 */
export async function getAvailableVoices() {
  try {
    const elevenLabsClient = getClient()
    const voices = await elevenLabsClient.voices.getAll()
    return voices.voices.map(voice => ({
      voice_id: voice.voiceId,
      name: voice.name,
      category: voice.category,
      labels: voice.labels
    }))
  } catch (error: any) {
    console.error('[ElevenLabs] Failed to fetch voices:', error?.message || error)
    throw new Error(`Failed to fetch voices: ${error?.message || 'Unknown error'}`)
  }
}

/**
 * Popular voice IDs for quick reference
 */
export const POPULAR_VOICES = {
  RACHEL: '21m00Tcm4TlvDq8ikWAM', // American Female
  DOMI: 'AZnzlk1XvdvUeBnXmlld',   // American Female
  BELLA: 'EXAVITQu4vr4xnSDxMaL',  // American Female
  ANTONI: 'ErXwobaYiN019PkySvjV', // American Male
  ELLI: 'MF3mGyEYCl7XYWbV9V6O',  // American Female
  JOSH: 'TxGEqnHWrfWFTfGW9XjX',  // American Male
  ARNOLD: 'VR6AewLTigWG4xSOukaG', // American Male
  ADAM: 'pNInz6obpgDQGcFmaJgB',  // American Male
  SAM: 'yoZ06aMxZJJ28mfd3POQ'    // American Male
} as const

/**
 * Supported source audio formats for voice cloning (Req 2.2).
 */
export const SUPPORTED_SAMPLE_FORMATS = ['mp3', 'wav', 'm4a', 'ogg', 'flac', 'webm'] as const

/**
 * Maximum allowed voice sample size in bytes (25 MB, Req 2.3).
 */
export const MAX_SAMPLE_BYTES = 25 * 1024 * 1024

/**
 * Emotion presets map a friendly emotion name to ElevenLabs voice settings
 * (Req 4.3). `stability` controls consistency vs. expressiveness and `style`
 * controls exaggeration.
 */
export const EMOTION_PRESETS = {
  neutral: { stability: 0.5, style: 0.0 },
  calm: { stability: 0.85, style: 0.1 },
  happy: { stability: 0.35, style: 0.55 },
  excited: { stability: 0.3, style: 0.7 },
  sad: { stability: 0.75, style: 0.2 },
  serious: { stability: 0.7, style: 0.15 },
  angry: { stability: 0.35, style: 0.7 },
} as const

export type Emotion = keyof typeof EMOTION_PRESETS

/** List of selectable emotions, for UI population. */
export const EMOTION_OPTIONS = Object.keys(EMOTION_PRESETS) as Emotion[]

/**
 * Resolve voice settings from a friendly emotion name, falling back to neutral.
 */
export function emotionToVoiceSettings(emotion?: string): { stability: number, style: number } {
  if (emotion && emotion in EMOTION_PRESETS) {
    return EMOTION_PRESETS[emotion as Emotion]
  }
  return EMOTION_PRESETS.neutral
}

/**
 * Validate an ElevenLabs API key by performing a lightweight authenticated
 * request (Req 1.1). Resolves `true` when the key is accepted, `false` when it
 * is rejected. Network/timeout failures are surfaced as a thrown error so the
 * caller can distinguish "invalid key" from "could not reach ElevenLabs".
 *
 * Note: the rest of this module reads `ELEVENLABS_API_KEY` from the
 * environment. This helper validates an *arbitrary* key (e.g. one a user just
 * submitted) without mutating the singleton client.
 */
export async function validateApiKey(apiKey: string, timeoutMs = 10_000): Promise<boolean> {
  const trimmed = (apiKey ?? '').trim()
  if (!trimmed) return false

  const probe = new ElevenLabsClient({ apiKey: trimmed })
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)

  try {
    await probe.voices.getAll({ abortSignal: controller.signal } as any)
    return true
  }
  catch (error: any) {
    // A 401/403 means the key reached ElevenLabs and was rejected.
    const status = error?.statusCode ?? error?.status
    if (status === 401 || status === 403) return false
    // Anything else (network error, abort/timeout) is not an auth verdict.
    throw new Error(`Could not reach ElevenLabs to validate the API key: ${error?.message || 'Unknown error'}`)
  }
  finally {
    clearTimeout(timer)
  }
}

/** A single uploaded voice sample to clone from. */
export interface CloneSampleInput {
  /** Raw audio bytes. */
  data: Buffer
  /** Original file name (used for the multipart upload). */
  filename: string
  /** MIME type, e.g. `audio/mpeg`. */
  contentType: string
}

export interface CloneVoiceResult {
  voiceId: string
  requiresVerification: boolean
}

/**
 * Create a cloned voice in ElevenLabs from one or more uploaded samples
 * (Req 2.1). Uses Instant Voice Cloning (IVC).
 *
 * @throws when ElevenLabs rejects the request or cloning fails (Req 2.6).
 */
export async function cloneVoiceFromSamples(
  name: string,
  samples: CloneSampleInput[],
  options: { description?: string, removeBackgroundNoise?: boolean } = {}
): Promise<CloneVoiceResult> {
  if (!name?.trim()) throw new Error('A voice name is required to clone a voice.')
  if (!samples.length) throw new Error('At least one voice sample is required to clone a voice.')

  const elevenLabsClient = getClient()

  // The SDK accepts web `File`/`Blob` instances (available globally on Node 18+)
  // for multipart uploads.
  const files = samples.map(s => new File([s.data], s.filename, { type: s.contentType }))

  console.log(`[ElevenLabs] Cloning voice "${name}" from ${files.length} sample(s)...`)

  try {
    const result = await elevenLabsClient.voices.ivc.create({
      name: name.trim(),
      files,
      description: options.description,
      removeBackgroundNoise: options.removeBackgroundNoise,
    })

    console.log(`[ElevenLabs] ✅ Voice cloned: ${result.voiceId}`)
    return {
      voiceId: result.voiceId,
      requiresVerification: result.requiresVerification ?? false,
    }
  }
  catch (error: any) {
    console.error('[ElevenLabs] ❌ Voice cloning failed:', error?.message || error)
    throw new Error(`ElevenLabs voice cloning failed: ${error?.message || 'Unknown error'}`)
  }
}

/**
 * Delete a cloned voice from ElevenLabs. Best-effort: a failure here should not
 * block removing the local library entry, so the caller decides how to handle
 * a thrown error.
 */
export async function deleteVoice(voiceId: string): Promise<void> {
  const elevenLabsClient = getClient()
  try {
    await elevenLabsClient.voices.delete(voiceId)
    console.log(`[ElevenLabs] 🗑️ Deleted voice: ${voiceId}`)
  }
  catch (error: any) {
    console.error('[ElevenLabs] Failed to delete voice:', error?.message || error)
    throw new Error(`Failed to delete voice from ElevenLabs: ${error?.message || 'Unknown error'}`)
  }
}
