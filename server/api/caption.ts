import { readBody, setResponseHeader } from 'h3'
import { requestSchema } from '../utils/transcription'
import { processVideoWithSubtitlesFile } from '../utils/captioning'

export default eventHandler(async (event) => {
  try {
    const body = await readBody(event);
    const { url, srtContent, outputName, fontSize, fontColor, fontFamily, fontStyle, subtitlePosition, horizontalAlignment, verticalMargin, showBackground, backgroundColor } = requestSchema.parse(body);
    
    try {
      const headResponse = await fetch(url, { method: 'HEAD' });
      if (!headResponse.ok) {
        throw new Error(`Video URL not accessible`);
      }
    } catch (error: any) {
      throw new Error(`Cannot access video URL`);
    }
    
    if (!srtContent) {
      throw new Error('SRT subtitle content is required');
    }
    const videoStream = await processVideoWithSubtitlesFile(url, srtContent, {
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