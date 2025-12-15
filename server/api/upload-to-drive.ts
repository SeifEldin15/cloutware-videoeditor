import type { Database } from '~~/types/database.types'
import { serverSupabaseServiceRole } from '#supabase/server'
import { useGoogleOauthClient } from '~~/server/utils/google/auth'
import { uploadToGoogle } from '~~/server/utils/google/drive'
import { processVideo } from '~~/server/utils/ffmpeg'
import { editCaption } from '~/utils/captions'
import { readBody } from 'h3'

export default eventHandler(async (event) => {
  const supabase = await serverSupabaseServiceRole<Database>(event)
  const { scheduleId } = await readBody(event)
  
  if (!scheduleId) {
    throw createError({ statusCode: 400, message: 'Schedule ID is required' })
  }
  
  // Try to get the video - first without processing_options in case column doesn't exist
  let videoToPost: any
  let videoToPostError: any
  
  try {
    const result = await supabase.from('queue').select('*, videos(*), processing_options').eq('schedule', scheduleId).is('posted', null).order('rank').limit(1).single()
    videoToPost = result.data
    videoToPostError = result.error
  } catch (e) {
    // If processing_options column doesn't exist, try without it
    console.log('Retrying without processing_options column...')
    const result = await supabase.from('queue').select('*, videos(*)').eq('schedule', scheduleId).is('posted', null).order('rank').limit(1).single()
    videoToPost = result.data
    videoToPostError = result.error
  }
  
  if (videoToPostError) {
    console.error('Queue query error:', videoToPostError)
    if (videoToPostError.code === 'PGRST116') {
      throw createError({ statusCode: 404, message: 'No videos available to upload in this schedule. All videos may have already been posted.' })
    }
    throw createError({ statusCode: 500, message: videoToPostError.message })
  }
  
  const { data: schedule, error: scheduleError } = await supabase.from('schedules').select('owner, drive').eq('id', scheduleId).single()
  if (scheduleError) throw createError({ statusCode: 500, message: scheduleError.message })
  if (!schedule.drive?.id) throw createError({ statusCode: 424, message: 'No google drive has been connected to this schedule.' })
  
  console.log('Schedule owner:', schedule.owner)
  console.log('Schedule drive:', schedule.drive)

  let videoToUpload = videoToPost.video

  // Check if video has processing options - if so, process it with AI first
  if (videoToPost.processing_options) {
    console.log('🎬 Video has AI processing options, processing before upload...')
    const { processVideoWithOptions } = await import('~~/server/utils/process-video-with-ai')

    try {
      // Process the video with AI
      const processedVideoName = await processVideoWithOptions(
        videoToPost.video,
        videoToPost.processing_options,
        supabase,
        scheduleId,
        event
      )

      // Update queue to use processed video and clear processing_options
      await supabase.from('queue').update({
        video: processedVideoName,
        processing_options: null
      }).eq('video', videoToPost.video).eq('schedule', scheduleId)

      videoToUpload = processedVideoName
      console.log(`✅ Video processed successfully: ${processedVideoName}`)
    } catch (error) {
      console.error('⚠️ Video processing failed, uploading original:', error)
      // Continue with original video if processing fails
    }
  }

  const { data: { publicUrl: fileURL } } = supabase.storage.from('videos').getPublicUrl(videoToUpload)
  const videoStream = processVideo(fileURL, videoToPost.video_edits)
  const auth = await useGoogleOauthClient(event, schedule.owner)

  const caption = videoToPost.caption_edits 
    ? editCaption(videoToPost.videos.caption || '', videoToPost.caption_edits) 
    : videoToPost.videos.caption || 'cloutware'

  const upload = await uploadToGoogle(videoStream, auth, caption, schedule.drive.id)
  
  const { data, error: updateScheduleError } = await supabase.from('schedules').update({ last_executed: 'now()' }).eq('id', scheduleId).select('last_executed').single()
  if (updateScheduleError) throw createError({ statusCode: 500, message: updateScheduleError.message })

  const { error: updateVideoPostedError } = await supabase.from('queue').update({ posted: 'now()' }).eq('video', videoToUpload).eq('schedule', scheduleId)
  if (updateVideoPostedError) throw createError({ statusCode: 500, message: updateVideoPostedError.message })

  return Object.assign(upload, data)
})
