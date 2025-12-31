// Video OCR Integration Examples
// This file shows how to use the Video OCR API in different scenarios

// ============================================================================
// Example 1: Basic Text Extraction
// ============================================================================

async function basicExtraction() {
  const response = await fetch('http://localhost:3001/api/extract-text', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      url: 'https://example.com/video.mp4'
    })
  })
  
  const result = await response.json()
  
  if (result.success) {
    console.log('Extracted text:', result.data.text)
    console.log('Confidence:', result.data.confidence)
  }
}

// ============================================================================
// Example 2: High-Accuracy Extraction (More Frames)
// ============================================================================

async function highAccuracyExtraction(videoUrl: string) {
  const response = await fetch('http://localhost:3000/api/extract-text', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      url: videoUrl,
      numberOfFrames: 15,
      confidenceThreshold: 80
    })
  })
  
  const result = await response.json()
  return result.data
}

// ============================================================================
// Example 3: Multi-Language Support
// ============================================================================

async function extractSpanishText(videoUrl: string) {
  const response = await fetch('http://localhost:3000/api/extract-text', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      url: videoUrl,
      language: 'spa', // Spanish
      numberOfFrames: 10
    })
  })
  
  const result = await response.json()
  return result.data.text
}

// ============================================================================
// Example 4: Batch Processing Multiple Videos
// ============================================================================

async function batchProcessVideos(videoUrls: string[]) {
  const results = []
  
  for (const url of videoUrls) {
    try {
  const response = await fetch('http://localhost:3001/api/extract-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url })
      })
      
      const result = await response.json()
      
      if (result.success) {
        results.push({
          url,
          text: result.data.text,
          confidence: result.data.confidence
        })
      }
    } catch (error) {
      console.error(`Failed to process ${url}:`, error)
    }
  }
  
  return results
}

// ============================================================================
// Example 5: Content Moderation Use Case
// ============================================================================

interface ModerationResult {
  videoUrl: string
  containsProhibitedContent: boolean
  detectedText: string
  matchedTerms: string[]
}

async function moderateVideoContent(
  videoUrl: string,
  prohibitedTerms: string[]
): Promise<ModerationResult> {
  const response = await fetch('http://localhost:3000/api/extract-text', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      url: videoUrl,
      numberOfFrames: 10,
      confidenceThreshold: 70
    })
  })
  
  const result = await response.json()
  
  if (!result.success) {
    throw new Error('Failed to extract text for moderation')
  }
  
  const extractedText = result.data.text.toLowerCase()
  const matchedTerms = prohibitedTerms.filter(term => 
    extractedText.includes(term.toLowerCase())
  )
  
  return {
    videoUrl,
    containsProhibitedContent: matchedTerms.length > 0,
    detectedText: result.data.text,
    matchedTerms
  }
}

// ============================================================================
// Example 6: Video Indexing for Search
// ============================================================================

interface VideoIndex {
  id: string
  url: string
  text: string
  keywords: string[]
  timestamp: Date
}

async function indexVideoForSearch(videoUrl: string): Promise<VideoIndex> {
  const response = await fetch('http://localhost:3000/api/extract-text', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      url: videoUrl,
      numberOfFrames: 12
    })
  })
  
  const result = await response.json()
  
  if (!result.success) {
    throw new Error('Failed to index video')
  }
  
  // Extract keywords from text
  const text = result.data.text
  const keywords = text
    .toLowerCase()
    .split(/\s+/)
    .filter(word => word.length > 3)
    .filter((word, index, self) => self.indexOf(word) === index) // unique
  
  return {
    id: generateVideoId(videoUrl),
    url: videoUrl,
    text,
    keywords,
    timestamp: new Date()
  }
}

function generateVideoId(url: string): string {
  // Simple hash function for demo
  return url.split('').reduce((a, b) => {
    a = ((a << 5) - a) + b.charCodeAt(0)
    return a & a
  }, 0).toString(36)
}

// ============================================================================
// Example 7: Progress Tracking with Frame-by-Frame Analysis
// ============================================================================

async function extractWithProgress(
  videoUrl: string,
  onProgress?: (frame: number, total: number) => void
) {
  const totalFrames = 10
  
  // This is a simplified example - in reality, you'd need to modify the API
  // to support progress callbacks or polling
  const response = await fetch('http://localhost:3000/api/extract-text', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      url: videoUrl,
      numberOfFrames: totalFrames
    })
  })
  
  const result = await response.json()
  
  // Report progress based on frame results
  if (result.success && onProgress) {
    result.data.frameResults.forEach((frame: any, index: number) => {
      onProgress(index + 1, totalFrames)
    })
  }
  
  return result.data
}

// Usage:
// extractWithProgress('https://example.com/video.mp4', (current, total) => {
//   console.log(`Processing frame ${current}/${total}`)
// })

// ============================================================================
// Example 8: Integration with Database Storage
// ============================================================================

interface VideoRecord {
  id: string
  url: string
  extractedText: string
  ocrConfidence: number
  processedAt: Date
  frameCount: number
}

// Simulated database
class VideoDatabase {
  private records: Map<string, VideoRecord> = new Map()
  
  async processAndStore(videoUrl: string): Promise<VideoRecord> {
    const response = await fetch('http://localhost:3000/api/extract-text', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url: videoUrl,
        numberOfFrames: 8
      })
    })
    
    const result = await response.json()
    
    if (!result.success) {
      throw new Error('Failed to process video')
    }
    
    const record: VideoRecord = {
      id: generateVideoId(videoUrl),
      url: videoUrl,
      extractedText: result.data.text,
      ocrConfidence: result.data.confidence,
      processedAt: new Date(),
      frameCount: result.data.totalFrames
    }
    
    this.records.set(record.id, record)
    return record
  }
  
  async search(query: string): Promise<VideoRecord[]> {
    const results: VideoRecord[] = []
    const searchTerm = query.toLowerCase()
    
    for (const record of this.records.values()) {
      if (record.extractedText.toLowerCase().includes(searchTerm)) {
        results.push(record)
      }
    }
    
    return results
  }
  
  async getById(id: string): Promise<VideoRecord | undefined> {
    return this.records.get(id)
  }
}

// Usage:
// const db = new VideoDatabase()
// const record = await db.processAndStore('https://example.com/video.mp4')
// const results = await db.search('product name')

// ============================================================================
// Example 9: Error Handling and Retry Logic
// ============================================================================

async function extractWithRetry(
  videoUrl: string,
  maxRetries = 3
): Promise<any> {
  let lastError: Error | null = null
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch('http://localhost:3000/api/extract-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: videoUrl })
      })
      
      const result = await response.json()
      
      if (result.success) {
        return result.data
      } else {
        throw new Error(result.error)
      }
    } catch (error) {
      lastError = error as Error
      console.log(`Attempt ${attempt}/${maxRetries} failed:`, error)
      
      if (attempt < maxRetries) {
        // Wait before retrying (exponential backoff)
        await new Promise(resolve => 
          setTimeout(resolve, Math.pow(2, attempt) * 1000)
        )
      }
    }
  }
  
  throw new Error(`Failed after ${maxRetries} attempts: ${lastError?.message}`)
}

// ============================================================================
// Example 10: Real-time Analysis of Live Stream Segments
// ============================================================================

async function analyzeStreamSegment(segmentUrl: string) {
  // Analyze a segment of a live stream
  const response = await fetch('http://localhost:3000/api/extract-text', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      url: segmentUrl,
      numberOfFrames: 3, // Few frames for quick analysis
      confidenceThreshold: 70
    })
  })
  
  const result = await response.json()
  
  return {
    timestamp: new Date(),
    text: result.data?.text || '',
    hasText: (result.data?.text || '').length > 0
  }
}

// Export examples for use
export {
  basicExtraction,
  highAccuracyExtraction,
  extractSpanishText,
  batchProcessVideos,
  moderateVideoContent,
  indexVideoForSearch,
  extractWithProgress,
  VideoDatabase,
  extractWithRetry,
  analyzeStreamSegment
}
