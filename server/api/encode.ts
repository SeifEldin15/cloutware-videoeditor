import { z } from 'zod'
import ffmpeg from '../utils/ffmpeg'

const schema = z.object({
  url: z.string(),
  output: z.enum(['video/full', 'video/stream', 'video/preview', 'image'])
})

export default eventHandler(async (event) => {
  // setResponseHeader(event, 'access-control-allow-origin', '*')
  // setResponseHeader(event, 'Cache-Control', 'no-cache')
  const {url, output} = await getValidatedQuery(event, schema.parse)
  
  const command = ffmpeg(url)
  let startTime: number

  if (output === 'image') {
    setResponseHeader(event, 'Content-Type', 'image/png')
    setResponseHeader(event, 'Content-Disposition', `inline; filename="video.png"`)
    command.frames(1).format('image2pipe').videoCodec('png').addOutputOption('-vsync vfr')
  }
  else {
    setResponseHeader(event, 'Content-Type', 'video/mkv')
    setResponseHeader(event, 'Content-Disposition', `inline; filename="video.mkv"`)
    command.format('mp4').withNativeFramerate().videoCodec('libx264').outputOptions(['-movflags isml+frag_keyframe+faststart', '-tune zerolatency', '-crf 23'])
  }

  command.on('error', console.error)
  command.on('start', () => (startTime = performance.now()))
  command.on('end', () => console.log(`Processed video time: ${performance.now() - startTime}`))

  return command.pipe()
})
