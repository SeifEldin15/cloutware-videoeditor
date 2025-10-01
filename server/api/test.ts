export default defineEventHandler(async (event) => {
  console.log('🧪 Test API endpoint called')
  
  if (event.node.req.method === 'GET') {
    return { 
      message: 'Test API is working!', 
      timestamp: new Date().toISOString(),
      hasAssemblyAI: !!process.env.ASSEMBLYAI_API_KEY
    }
  }
  
  if (event.node.req.method === 'POST') {
    const body = await readBody(event)
    console.log('🧪 Test POST received:', body)
    
    return {
      message: 'Test POST successful!',
      receivedData: body,
      timestamp: new Date().toISOString()
    }
  }
  
  return { error: 'Method not allowed' }
})