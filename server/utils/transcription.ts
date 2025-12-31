import { z } from 'zod'

function getApiKey(): string {
  const apiKey = process.env.ASSEMBLYAI_API_KEY;
  if (!apiKey) {
    throw new Error('ASSEMBLYAI_API_KEY environment variable is not set. Please configure it to use transcription features.');
  }
  return apiKey;
}

export async function transcribeVideo(url: string, language: string) {
  const apiKey = getApiKey();
  
  try {
    const response = await fetch('https://api.assemblyai.com/v2/transcript', {
      method: 'POST',
      headers: {
        'Authorization': apiKey,
        'Content-Type': 'application/json'
      } as HeadersInit,
      body: JSON.stringify({
        audio_url: url
      })
    });
    
    const responseText = await response.text();
    let responseData;
    
    try {
      responseData = JSON.parse(responseText);
    } catch (e) {
      throw new Error(`Invalid JSON response from AssemblyAI`);
    }

    if (!response.ok) {
      throw new Error(`AssemblyAI API error`);
    }

    const transcriptId = responseData.id;
    if (!transcriptId) {
      throw new Error(`AssemblyAI did not return a transcript ID`);
    }

    while (true) {
      const statusResponse = await fetch(`https://api.assemblyai.com/v2/transcript/${transcriptId}`, {
        headers: {
          'Authorization': apiKey
        } as HeadersInit
      });
      
      const statusText = await statusResponse.text();
      let statusData;
      
      try {
        statusData = JSON.parse(statusText);
      } catch (e) {
        throw new Error(`Invalid JSON from status check`);
      }

      if (!statusResponse.ok) {
        throw new Error(`AssemblyAI status check error`);
      }
      
      if (statusData.status === 'completed') {
        return statusData;
      } else if (statusData.status === 'error') {
        throw new Error(`Transcription failed`);
      }

      await new Promise(resolve => setTimeout(resolve, 3000));
    }
  } catch (error) {
    throw error;
  }
}

export const requestSchema = z.object({
  url: z.string().url('Invalid video URL'),
  srtContent: z.string().optional(),
  outputName: z.string().regex(/^[a-zA-Z0-9_-]+$/, 'Output name can only contain letters, numbers, underscores and hyphens').optional().default('captioned_video'),
  language: z.string().optional().default('en'),
  fontSize: z.number().min(8).max(72).optional().default(24),
  fontColor: z.string().optional().default('white'),
  fontFamily: z.string().optional().default('Sans'),
  fontStyle: z.string().optional().default('regular'),
  subtitlePosition: z.string().optional().default('bottom'),
  horizontalAlignment: z.enum(['left', 'center', 'right']).optional().default('center'),
  verticalMargin: z.number().min(0).max(200).optional().default(50),
  showBackground: z.boolean().optional().default(true),
  backgroundColor: z.string().optional().default('black@0.5')
}); 