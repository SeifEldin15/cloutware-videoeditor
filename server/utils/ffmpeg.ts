import type { Codecs, Encoders } from 'fluent-ffmpeg'
import { path, version } from '@ffmpeg-installer/ffmpeg'
import ffmpeg from 'fluent-ffmpeg'

ffmpeg.setFfmpegPath(path)
console.info(`Installed FFmpeg ${version}`)

export const encoders = new Promise<Encoders>((resolve, reject) => ffmpeg.availableEncoders((err, res) => err ? reject(err) : resolve(res))).then(Object.keys)
export const codecs = new Promise<Codecs>((resolve, reject) => ffmpeg.availableCodecs((err, res) => err ? reject(err) : resolve(res))).then(Object.keys)
export default ffmpeg

