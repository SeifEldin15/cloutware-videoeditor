import { z } from 'zod'
import { readBody, setResponseHeader } from 'h3'

const requestSchema = z.object({
  text: z.string().min(1, 'Text is required'),
  voice: z.string().optional().default('21m00Tcm4TlvDq8ikWAM'), // Default Voice ID for ElevenLabs (Rachel)
  speed: z.number().min(0.5).max(2.0).optional().default(1.0)
});

if (!process.env.ELEVENLABS_API_KEY) {
  throw new Error('ELEVENLABS_API_KEY environment variable is not set');
}

const apiKey = process.env.ELEVENLABS_API_KEY;

export default eventHandler(async (event) => {
  try {
    const body = await readBody(event);
    const { text, voice, speed } = requestSchema.parse(body);

    console.log(`Converting text to speech with voice: ${voice}`);

    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voice}`, {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'xi-api-key': apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        text: text,
        model_id: "eleven_monolingual_v1",
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.5,
          style: 0.0,
          speed: speed
        }
      })
    });

    if (!response.ok) {
      let errorMessage = `ElevenLabs API error: Status ${response.status}`;
      try {
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const error = await response.json();
          errorMessage = `ElevenLabs API error: ${error.detail || error.message || JSON.stringify(error)}`;
        } else {
          const text = await response.text();
          errorMessage = `ElevenLabs API error: ${text}`;
        }
      } catch (e) {
        errorMessage = `ElevenLabs API error: ${response.statusText || 'Unknown error'}`;
      }
      throw new Error(errorMessage);
    }

    const audioBuffer = await response.arrayBuffer();

    setResponseHeader(event, 'Content-Type', 'audio/mpeg');
    setResponseHeader(event, 'Content-Disposition', 'attachment; filename="speech.mp3"');

    return Buffer.from(audioBuffer);

  } catch (error) {
    console.error('Error in text-to-speech:', error);
    event.node.res.statusCode = 500;
    
    const errorMessage = error instanceof Error 
      ? error.message 
      : 'Unknown error occurred';
      
    return { error: 'Failed to convert text to speech: ' + errorMessage };
  }
}); 