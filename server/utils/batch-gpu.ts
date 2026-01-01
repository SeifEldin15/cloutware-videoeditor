/**
 * AWS Batch helper for GPU FFmpeg encoding
 * This submits jobs to AWS Batch and polls for completion
 */

import { BatchClient, SubmitJobCommand, DescribeJobsCommand } from "@aws-sdk/client-batch"

const AWS_REGION = process.env.AWS_REGION || 'us-west-1'
const JOB_QUEUE = process.env.BATCH_JOB_QUEUE || 'video-processing-queue'
const JOB_DEFINITION = process.env.BATCH_JOB_DEFINITION || 'video-processing-job'

const batchClient = new BatchClient({ region: AWS_REGION })

export interface BatchPayload {
    url: string
    outputName: string
    format: string
    options?: any
    caption?: any
}

export interface BatchResult {
    success: boolean
    outputPath?: string
    error?: string
}

/**
 * Submit FFmpeg encode job to AWS Batch and wait for completion
 */
export async function submitGpuEncodeJob(
    payload: BatchPayload,
    maxWaitMs: number = 900000
): Promise<BatchResult> {
    
    const jobName = `ffmpeg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    
    console.log(`🚀 [Batch] Submitting GPU encode job: ${jobName}`)
    
    try {
        const submitCommand = new SubmitJobCommand({
            jobName,
            jobQueue: JOB_QUEUE,
            jobDefinition: JOB_DEFINITION,
            containerOverrides: {
                environment: [
                    { name: 'BATCH_PAYLOAD', value: JSON.stringify(payload) },
                    { name: 'SUPABASE_URL', value: process.env.SUPABASE_URL || '' },
                    { name: 'SUPABASE_SERVICE_ROLE_KEY', value: process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY || '' },
                    { name: 'USE_GPU', value: 'true' },
                ]
            }
        })
        
        const submitResponse = await batchClient.send(submitCommand)
        const jobId = submitResponse.jobId
        
        if (!jobId) {
            return { success: false, error: 'No job ID returned from AWS Batch' }
        }
        
        console.log(`✅ [Batch] Job submitted: ${jobId}`)
        
        // Poll for completion
        const startTime = Date.now()
        const pollInterval = 5000
        
        while (Date.now() - startTime < maxWaitMs) {
            await new Promise(r => setTimeout(r, pollInterval))
            
            const describeCommand = new DescribeJobsCommand({ jobs: [jobId] })
            const describeResponse = await batchClient.send(describeCommand)
            
            const job = describeResponse.jobs?.[0]
            if (!job) {
                return { success: false, error: `Job ${jobId} not found` }
            }
            
            console.log(`⏳ [Batch] Job ${jobId} status: ${job.status}`)
            
            if (job.status === 'SUCCEEDED') {
                const outputPath = `processed/${payload.outputName}.mp4`
                console.log(`✅ [Batch] Job completed! Output: ${outputPath}`)
                return { success: true, outputPath }
            }
            
            if (job.status === 'FAILED') {
                return { success: false, error: `Job failed: ${job.statusReason || 'Unknown'}` }
            }
        }
        
        return { success: false, error: 'Job timed out' }
        
    } catch (error) {
        console.error('❌ [Batch] Submission error:', error)
        return { 
            success: false, 
            error: error instanceof Error ? error.message : 'Unknown error' 
        }
    }
}
