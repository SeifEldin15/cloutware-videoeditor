import { PassThrough } from 'node:stream'

/**
 * ElevenLabs Voice IDs
 * Popular voices from the ElevenLabs voice library
 */
export const VOICE_IDS = {
  RACHEL: '21m00Tcm4TlvDq8ikWAM',      // American Female
  JOSH: 'TxGEqnHWrfWFTfGW9XjX',        // American Male
  ANTONI: 'ErXwobaYiN019PkySvjV',      // American Male
  ELLI: 'MF3mGyEYCl7XYWbV9V6O',        // American Female
  DOMI: 'AZnzlk1XvdvUeBnXmlld',        // American Female
  BELLA: 'EXAVITQu4vr4xnSDxMaL',       // American Female
  ARNOLD: 'VR6AewLTigWG4xSOukaG',      // American Male (Arnold Schwarzenegger-like)
  ADAM: 'pNInz6obpgDQGcFmaJgB',        // American Male (Deep)
  SAM: 'yoZ06aMxZJJ28mfd3POQ',         // American Male (Young)
} as const

export interface ElevenLabsOptions {
  voiceId?: string
  modelId?: string
  stability?: number        // 0.0 - 1.0
  similarityBoost?: number  // 0.0 - 1.0
  style?: number           // 0.0 - 1.0
  speed?: number           // 0.25 - 4.0
  useSpeakerBoost?: boolean
}

export interface Voice {
  voice_id: string
  name: string
  category: string
  description?: string
  labels?: Record<string, string>
}

/**
 * Generate speech from text using ElevenLabs API
 * @param text The text to convert to speech
 * @param options Voice and audio generation options
 * @returns A readable stream of MP3 audio data
 */
export async function generateSpeech(
  text: string,
  options: ElevenLabsOptions = {}
): Promise<PassThrough> {
  const apiKey = process.env.ELEVENLABS_API_KEY
  if (!apiKey) {
    throw new Error('ELEVENLABS_API_KEY environment variable is not set')
  }

  const {
    voiceId = VOICE_IDS.RACHEL,
    modelId = 'eleven_multilingual_v2',
    stability = 0.5,
    similarityBoost = 0.75,
    style = 0.0,
    speed = 1.0,
    useSpeakerBoost = true
  } = options

  const url = `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/stream`

  const requestBody = {
    text,
    model_id: modelId,
    voice_settings: {
      stability,
      similarity_boost: similarityBoost,
      style,
      use_speaker_boost: useSpeakerBoost
    },
    speed
  }

  console.log('[ElevenLabs] Generating speech...', {
    voiceId,
    textLength: text.length,
    speed,
    stability
  })

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Accept': 'audio/mpeg',
      'Content-Type': 'application/json',
      'xi-api-key': apiKey
    },
    body: JSON.stringify(requestBody)
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`ElevenLabs API error (${response.status}): ${errorText}`)
  }

  if (!response.body) {
    throw new Error('No response body from ElevenLabs API')
  }

  // Convert web ReadableStream to Node.js stream
  const passThrough = new PassThrough()
  const reader = response.body.getReader()

  const pump = async () => {
    try {
      while (true) {
        const { done, value } = await reader.read()
        if (done) {
          passThrough.end()
          break
        }
        if (!passThrough.write(value)) {
          await new Promise(resolve => passThrough.once('drain', resolve))
        }
      }
    } catch (error) {
      passThrough.destroy(error as Error)
    }
  }

  pump()
  console.log('[ElevenLabs] Speech generation started')

  return passThrough
}

/**
 * Get available voices from ElevenLabs
 * @returns Array of available voices
 */
export async function getAvailableVoices(): Promise<Voice[]> {
  const apiKey = process.env.ELEVENLABS_API_KEY
  if (!apiKey) {
    throw new Error('ELEVENLABS_API_KEY environment variable is not set')
  }

  const response = await fetch('https://api.elevenlabs.io/v1/voices', {
    method: 'GET',
    headers: {
      'xi-api-key': apiKey
    }
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`ElevenLabs API error (${response.status}): ${errorText}`)
  }

  const data = await response.json() as { voices: Voice[] }
  return data.voices
}
