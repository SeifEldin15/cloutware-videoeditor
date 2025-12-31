import { createClient } from '@supabase/supabase-js'
import { VideoProcessor } from './utils/video-processor'
import { SubtitleProcessor } from './utils/subtitle-processor'
import { TextReplacementProcessor } from './utils/text-replacement-processor'
import * as fs from 'fs'
import * as path from 'path'
import * as os from 'os'
import { PassThrough } from 'stream'

// Define input arguments schema
interface BatchJobPayload {
  url: string
  outputName: string
  format?: string
  options?: any
  caption?: {
    srtContent?: string
    textReplacements?: any[]
    [key: string]: any
  }
}

// Main execution function
async function run() {
  console.log('🚀 Starting Video Processing Batch Job')
  
  // 1. Parse Arguments
  // Using simplified argument parsing: expect a JSON string as the last argument OR env var
  const payloadStr = process.env.BATCH_PAYLOAD || process.argv[2]
  
  if (!payloadStr) {
    console.error('❌ Error: No payload provided. Set BATCH_PAYLOAD env var or pass JSON string as argument.')
    process.exit(1)
  }
  
  let payload: BatchJobPayload
  try {
    payload = JSON.parse(payloadStr)
    console.log('📥 Payload received:', JSON.stringify(payload, null, 2))
  } catch (e) {
    console.error('❌ Error: Invalid JSON payload')
    process.exit(1)
  }
  
  const { url, outputName, format = 'mp4', options = {}, caption } = payload
  
  // 2. Initialize Supabase (for uploading result)
  const supabaseUrl = process.env.SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Error: Missing SUPABASE_URL or SUPABASE_KEY/SUPABASE_SERVICE_ROLE_KEY env vars')
    process.exit(1)
  }
  
  const supabase = createClient(supabaseUrl, supabaseKey)
  
  try {
    console.log(`🎬 Processing video: ${url}`)
    
    // 3. Process Video (Wait for stream)
    let videoStream: PassThrough
    
    // Logic mirrored from api/encode.ts
    // -----------------------------------------------------------------------
    if (format !== 'mp4' && caption?.srtContent) {
        throw new Error('Captions can only be applied to MP4 format videos')
    }
    
    if (format !== 'mp4' && caption?.textReplacements?.length) {
        throw new Error('Text replacements can only be applied to MP4 format videos')
    }
    
    // Validate URL
    const headResponse = await fetch(url, { method: 'HEAD' })
    if (!headResponse.ok) throw new Error(`Video URL not accessible: ${url}`)
        
    if (format === 'mp4' && caption?.textReplacements?.length) {
        console.log(`Processing with ${caption.textReplacements.length} text replacement(s)`)
        videoStream = await TextReplacementProcessor.process(url, caption.textReplacements, options, outputName)
    } else if (format === 'mp4' && caption?.srtContent) {
        console.log('Processing with subtitles')
        // Basic vs Advanced check
        if ((caption.subtitleStyle && caption.subtitleStyle !== 'basic') || (caption.wordMode && caption.wordMode !== 'normal')) {
             videoStream = await SubtitleProcessor.processAdvanced(url, caption, options)
        } else {
             videoStream = await SubtitleProcessor.processBasic(url, caption)
        }
    } else {
        console.log('Processing video transformations only')
        videoStream = await VideoProcessor.process(url, format, options, outputName)
    }
    // -----------------------------------------------------------------------
    
    // 4. Stream to Temp File (Supabase upload need known size or file path for reliability)
    const tempFilePath = path.join(os.tmpdir(), `${outputName}_${Date.now()}.${format}`)
    console.log(`💾 Streaming output to temp file: ${tempFilePath}`)
    
    const writeStream = fs.createWriteStream(tempFilePath)
    
    await new Promise((resolve, reject) => {
        videoStream.pipe(writeStream)
        videoStream.on('error', reject)
        writeStream.on('finish', () => resolve(null))
        writeStream.on('error', reject)
    })
    
    console.log('✅ Processing complete. File saved to disk.')
    
    // 5. Upload to Supabase
    const stats = fs.statSync(tempFilePath)
    console.log(`📤 Uploading to Supabase Storage (${stats.size} bytes)...`)
    
    const fileContent = fs.readFileSync(tempFilePath)
    
    // Assuming 'videos' bucket - customizable via payload if needed
    const bucket = process.env.SUPABASE_BUCKET || 'videos'
    const storagePath = `processed/${outputName}.${format}` // Or user defined path
    
    const { data, error } = await supabase.storage
        .from(bucket)
        .upload(storagePath, fileContent, {
            contentType: `video/${format}`,
            upsert: true
        })
        
    if (error) throw error
    
    console.log(`🎉 Upload successful! Path: ${storagePath}`)
    
    // 6. Cleanup
    fs.unlinkSync(tempFilePath)
    console.log('🧹 Cleaned up temp file')
    
    process.exit(0)

  } catch (error) {
    console.error('❌ Fatal Error:', error)
    process.exit(1)
  }
}

run()
