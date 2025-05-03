import { readBody, setResponseHeader } from 'h3'
import { transcribeVideo, requestSchema } from '../utils/transcription'
import { processVideoWithTimedSubtitles } from '../utils/captioning'

export default eventHandler(async (event) => {
  try {
    const body = await readBody(event);
    const { url, outputName, language, fontSize, fontColor, fontFamily, fontStyle, subtitlePosition, horizontalAlignment, verticalMargin, showBackground, backgroundColor } = requestSchema.parse(body);
    
    try {
      const headResponse = await fetch(url, { method: 'HEAD' });
      if (!headResponse.ok) {
        throw new Error(`Video URL not accessible`);
      }
    } catch (error: any) {
      throw new Error(`Cannot access video URL`);
    }
    
    const transcript = await transcribeVideo(url, language);
    const videoStream = await processVideoWithTimedSubtitles(url, transcript, {
      fontSize,
      fontColor,
      fontFamily,
      fontStyle,
      subtitlePosition,
      horizontalAlignment,
      verticalMargin,
      showBackground,
      backgroundColor
    });
    
    setResponseHeader(event, 'Content-Type', 'video/mp4');
    setResponseHeader(event, 'Content-Disposition', `attachment; filename="${outputName}.mp4"`);
    
    return videoStream;
    
  } catch (error) {
    event.node.res.statusCode = 500;
    
    const errorMessage = error instanceof Error 
      ? error.message 
      : 'Unknown error occurred';
      
    return { error: 'Failed to process video: ' + errorMessage };
  }
}); 