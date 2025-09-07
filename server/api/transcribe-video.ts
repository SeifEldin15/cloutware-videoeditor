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
  console.warn('ASSEMBLYAI_API_KEY environment variable is not set - using demo mode');
}

const apiKey = process.env.ASSEMBLYAI_API_KEY;


function convertToSRT(words: any[]) {
  if (!words || words.length === 0) {
    return '';
  }

  // Format time from milliseconds to SRT format (HH:MM:SS,mmm)
  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    const milliseconds = ms % 1000;
    
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')},${String(milliseconds).padStart(3, '0')}`;
  };

  // Create segments based on pauses in speech
  // We'll consider a pause significant if it's more than 700ms
  const PAUSE_THRESHOLD = 700;
  const segments = [];
  let currentSegment = {
    words: [words[0]],
    start: words[0].start,
    end: words[0].end
  };

  for (let i = 1; i < words.length; i++) {
    const currentWord = words[i];
    const previousWord = words[i-1];
    const pause = currentWord.start - previousWord.end;

    // If there's a significant pause or we've accumulated enough words (max 10)
    if (pause > PAUSE_THRESHOLD || currentSegment.words.length >= 10) {
      // Finish current segment
      segments.push({
        start: currentSegment.start,
        end: currentSegment.end,
        text: currentSegment.words.map(w => w.text).join(' ')
      });

      // Start new segment
      currentSegment = {
        words: [currentWord],
        start: currentWord.start,
        end: currentWord.end
      };
    } else {
      // Add word to current segment
      currentSegment.words.push(currentWord);
      currentSegment.end = currentWord.end;
    }
  }

  // Add the last segment if it has any words
  if (currentSegment.words.length > 0) {
    segments.push({
      start: currentSegment.start,
      end: currentSegment.end,
      text: currentSegment.words.map(w => w.text).join(' ')
    });
  }

  // Convert segments to SRT format
  return segments.map((segment, index) => {
    return `${index + 1}\n${formatTime(segment.start)} --> ${formatTime(segment.end)}\n${segment.text}\n`;
  }).join('\n');
}

export default eventHandler(async (event) => {
  try {
    const body = await readBody(event);
    const { url, outputFormat, language, speakerLabels, punctuate, formatText } = requestSchema.parse(body);

    console.log(`Transcribing video from URL: ${url}`);

    // Demo mode if API key is not set
    if (!process.env.ASSEMBLYAI_API_KEY) {
      const demoSrt = `1
00:00:00,000 --> 00:00:03,000
This is a demo subtitle for testing.

2
00:00:03,000 --> 00:00:06,000
The actual transcription requires an AssemblyAI API key.

3
00:00:06,000 --> 00:00:10,000
You can get one at https://www.assemblyai.com/

4
00:00:10,000 --> 00:00:13,000
Set it as ASSEMBLYAI_API_KEY environment variable.`;

      return {
        subtitles: demoSrt,
        text: "This is a demo subtitle for testing. The actual transcription requires an AssemblyAI API key. You can get one at https://www.assemblyai.com/ Set it as ASSEMBLYAI_API_KEY environment variable.",
        confidence: 0.95,
        demo: true
      };
    }

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
            return { text: transcript.text };
          case 'srt':
            return { 
              subtitles: convertToSRT(transcript.words),
              text: transcript.text,
              confidence: transcript.confidence
            };
          case 'vtt':
            return { text: transcript.text };
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