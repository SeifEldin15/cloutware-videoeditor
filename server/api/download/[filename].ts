import { readFileSync, existsSync } from 'fs'
import { join } from 'path'

export default defineEventHandler(async (event) => {
  const filename = getRouterParam(event, 'filename')
  
  if (!filename) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Filename is required'
    })
  }

  // Security: Only allow specific file types and sanitize filename
  const allowedExtensions = ['.mp4', '.webm', '.srt', '.vtt', '.txt', '.json']
  const fileExtension = filename.substring(filename.lastIndexOf('.'))
  
  if (!allowedExtensions.includes(fileExtension.toLowerCase())) {
    throw createError({
      statusCode: 400,
      statusMessage: 'File type not allowed'
    })
  }

  // Sanitize filename to prevent directory traversal
  const sanitizedFilename = filename.replace(/[^a-zA-Z0-9.-]/g, '_')
  
  // Try multiple possible download directories
  const possiblePaths = [
    join(process.cwd(), 'downloads', sanitizedFilename),
    join(process.cwd(), 'public', 'downloads', sanitizedFilename),
    join(process.cwd(), 'temp', sanitizedFilename),
    join(process.cwd(), sanitizedFilename)
  ]

  let filePath: string | null = null
  for (const path of possiblePaths) {
    if (existsSync(path)) {
      filePath = path
      break
    }
  }

  if (!filePath) {
    throw createError({
      statusCode: 404,
      statusMessage: 'File not found'
    })
  }

  try {
    const fileContent = readFileSync(filePath)
    
    // Set appropriate headers based on file type
    const mimeTypes: Record<string, string> = {
      '.mp4': 'video/mp4',
      '.webm': 'video/webm',
      '.srt': 'text/plain',
      '.vtt': 'text/vtt',
      '.txt': 'text/plain',
      '.json': 'application/json'
    }

    const mimeType = mimeTypes[fileExtension.toLowerCase()] || 'application/octet-stream'
    
    setHeader(event, 'Content-Type', mimeType)
    setHeader(event, 'Content-Disposition', `attachment; filename="${sanitizedFilename}"`)
    setHeader(event, 'Content-Length', fileContent.length)
    
    return fileContent

  } catch (error) {
    console.error('Error reading file:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Error reading file'
    })
  }
})