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
    console.log('🔍 Transcribe API called')
    console.log('🔑 API Key available:', !!apiKey)
    console.log('🔑 API Key preview:', apiKey ? `${apiKey.substring(0, 8)}...` : 'NOT SET')
    
    const body = await readBody(event);
    console.log('📦 Request body received:', body)
    
    const { url, outputFormat, language, speakerLabels, punctuate, formatText } = requestSchema.parse(body);

    console.log(`🎬 Transcribing video from URL: ${url}`)
    console.log('⚙️ Transcription settings:', { outputFormat, language, speakerLabels, punctuate, formatText })

    console.log('🚀 Making AssemblyAI API request...')
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

    console.log('📡 AssemblyAI response status:', response.status)

    if (!response.ok) {
      const error = await response.json();
      console.error('❌ AssemblyAI API error:', error)
      throw new Error(`AssemblyAI API error: ${error.message || 'Unknown error'}`);
    }

    const transcriptionRequest = await response.json();
    const transcriptId = transcriptionRequest.id;
    console.log('📝 Transcription job started with ID:', transcriptId)

    while (true) {
      console.log('🔄 Checking transcription status...')
      const statusResponse = await fetch(`https://api.assemblyai.com/v2/transcript/${transcriptId}`, {
        headers: {
          'Authorization': apiKey
        } as HeadersInit
      });

      if (!statusResponse.ok) {
        const error = await statusResponse.json();
        console.error('❌ Status check error:', error)
        throw new Error(`AssemblyAI API error: ${error.message || 'Unknown error'}`);
      }

      const transcript = await statusResponse.json();
      console.log('📊 Transcription status:', transcript.status)

      if (transcript.status === 'completed') {
        console.log('✅ Transcription completed!')
        console.log('📄 Output format requested:', outputFormat)
        
        switch (outputFormat) {
          case 'text':
            console.log('📝 Returning text format')
            return { transcription: transcript.text };
          case 'srt':
            console.log('📝 Converting to SRT format')
            const srtContent = convertToSRT(transcript.words);
            console.log('📝 SRT content length:', srtContent.length)
            return { transcription: srtContent };
          case 'vtt':
            console.log('📝 Returning VTT format')
            return { transcription: transcript.text };
          case 'json':
          default:
            console.log('📝 Returning JSON format')
            return {
              transcription: transcript.text,
              text: transcript.text,
              words: transcript.words,
              confidence: transcript.confidence,
              language: transcript.language_code,
              duration: transcript.audio_duration
            };
        }
      } else if (transcript.status === 'error') {
        console.error('❌ Transcription failed:', transcript.error)
        throw new Error(`Transcription failed: ${transcript.error}`);
      } else {
        console.log('⏱️ Transcription still processing, waiting 3 seconds...')
      }

      await new Promise(resolve => setTimeout(resolve, 3000));
    }

  } catch (error) {
    console.error('💥 Error transcribing video:', error);
    event.node.res.statusCode = 500;
    
    const errorMessage = error instanceof Error 
      ? error.message 
      : 'Unknown error occurred';
    
    console.error('🚨 Returning error to client:', errorMessage);
    return { error: 'Failed to transcribe video: ' + errorMessage };
  }
}); 