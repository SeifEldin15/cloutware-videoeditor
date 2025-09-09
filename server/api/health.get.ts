// Health check endpoint for monitoring and load balancers
export default defineEventHandler(async (event) => {
  const startTime = Date.now()
  
  try {
    // Basic health checks
    const checks = {
      timestamp: new Date().toISOString(),
      status: 'healthy',
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      nodejs: process.version,
      environment: process.env.NODE_ENV || 'development',
      checks: {}
    }
    
    // Check FFmpeg availability
    try {
      const ffmpeg = await import('fluent-ffmpeg')
      const ffmpegPath = ffmpeg.default.getAvailableFormats ? 'available' : 'installed'
      checks.checks.ffmpeg = { status: 'ok', path: ffmpegPath }
    } catch (error) {
      checks.checks.ffmpeg = { status: 'error', message: error.message }
      checks.status = 'degraded'
    }
    
    // Check disk space (uploads directory)
    try {
      const fs = await import('fs').then(m => m.promises)
      const uploadsPath = './uploads'
      
      try {
        await fs.access(uploadsPath)
        const stats = await fs.stat(uploadsPath)
        checks.checks.uploads_directory = { 
          status: 'ok', 
          accessible: true,
          created: stats.birthtime
        }
      } catch {
        checks.checks.uploads_directory = { 
          status: 'warning', 
          accessible: false,
          message: 'Uploads directory not accessible'
        }
      }
    } catch (error) {
      checks.checks.uploads_directory = { 
        status: 'error', 
        message: error.message 
      }
    }
    
    // Response time
    checks.response_time_ms = Date.now() - startTime
    
    // Set appropriate HTTP status
    const httpStatus = checks.status === 'healthy' ? 200 : 
                      checks.status === 'degraded' ? 200 : 503
    
    setResponseStatus(event, httpStatus)
    setResponseHeader(event, 'Content-Type', 'application/json')
    setResponseHeader(event, 'Cache-Control', 'no-cache, no-store, must-revalidate')
    
    return checks
    
  } catch (error) {
    setResponseStatus(event, 503)
    setResponseHeader(event, 'Content-Type', 'application/json')
    
    return {
      timestamp: new Date().toISOString(),
      status: 'unhealthy',
      error: error.message,
      response_time_ms: Date.now() - startTime
    }
  }
})
