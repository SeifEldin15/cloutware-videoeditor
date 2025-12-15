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
        useSpeakerBoost: true
      }
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
