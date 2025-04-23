import { z } from 'zod'
import { readBody } from 'h3'

const requestSchema = z.object({
  url: z.string().url('Invalid video URL'),
  outputFormat: z.enum(['json', 'text', 'srt', 'vtt']).optional().default('json'),
  language: z.string().optional().default('en'),
  speakerLabels: z.boolean().optional().default(false),
  punctuate: z.boolean().optional().default(true),
  formatText: z.boolean().optional().default(true)
});

if (!process.env.ASSEMBLYAI_API_KEY) {
  throw new Error('ASSEMBLYAI_API_KEY environment variable is not set');
}

const apiKey = process.env.ASSEMBLYAI_API_KEY;


function convertToSRT(words: any[]) {
  if (!words || words.length === 0) {
    return '';
  }

  const segments = [];
  const wordsPerSegment = 5;
  
  for (let i = 0; i < words.length; i += wordsPerSegment) {
    const segmentWords = words.slice(i, i + wordsPerSegment);
    if (segmentWords.length > 0) {
      segments.push({
        start: segmentWords[0].start,
        end: segmentWords[segmentWords.length - 1].end,
        text: segmentWords.map(w => w.text).join(' ')
      });
    }
  }

  return segments.map((segment, index) => {
    const formatTime = (ms: number) => {
      const totalSeconds = Math.floor(ms / 1000);
      const hours = Math.floor(totalSeconds / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      const seconds = totalSeconds % 60;
      const milliseconds = ms % 1000;
      
      return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')},${String(milliseconds).padStart(3, '0')}`;
    };

    return `${index + 1}\n${formatTime(segment.start)} --> ${formatTime(segment.end)}\n${segment.text}\n`;
  }).join('\n');
}

export default eventHandler(async (event) => {
  try {
    const body = await readBody(event);
    const { url, outputFormat, language, speakerLabels, punctuate, formatText } = requestSchema.parse(body);

    console.log(`Transcribing video from URL: ${url}`);

    const response = await fetch('https://api.assemblyai.com/v2/transcript', {
      method: 'POST',
      headers: {
        'Authorization': apiKey,
        'Content-Type': 'application/json'
      } as HeadersInit,
      body: JSON.stringify({
        audio_url: url,
        language_code: language,
        speaker_labels: speakerLabels,
        punctuate,
        format_text: formatText
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`AssemblyAI API error: ${error.message || 'Unknown error'}`);
    }

    const transcriptionRequest = await response.json();
    const transcriptId = transcriptionRequest.id;

    while (true) {
      const statusResponse = await fetch(`https://api.assemblyai.com/v2/transcript/${transcriptId}`, {
        headers: {
          'Authorization': apiKey
        } as HeadersInit
      });

      if (!statusResponse.ok) {
        const error = await statusResponse.json();
        throw new Error(`AssemblyAI API error: ${error.message || 'Unknown error'}`);
      }

      const transcript = await statusResponse.json();

      if (transcript.status === 'completed') {
        switch (outputFormat) {
          case 'text':
            return transcript.text;
          case 'srt':
            return convertToSRT(transcript.words);
          case 'vtt':
            return transcript.text;
          case 'json':
          default:
            return {
              text: transcript.text,
              words: transcript.words,
              confidence: transcript.confidence,
              language: transcript.language_code,
              duration: transcript.audio_duration
            };
        }
      } else if (transcript.status === 'error') {
        throw new Error(`Transcription failed: ${transcript.error}`);
      }

      await new Promise(resolve => setTimeout(resolve, 3000));
    }

  } catch (error) {
    console.error('Error transcribing video:', error);
    event.node.res.statusCode = 500;
    
    const errorMessage = error instanceof Error 
      ? error.message 
      : 'Unknown error occurred';
      
    return { error: 'Failed to transcribe video: ' + errorMessage };
  }
}); 