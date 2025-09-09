// Health check script for Docker
import http from 'http'

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/health',
  method: 'GET',
  timeout: 2000
}

const req = http.request(options, (res) => {
  if (res.statusCode === 200) {
    process.exit(0)
  } else {
    console.error(`Health check failed with status: ${res.statusCode}`)
    process.exit(1)
  }
})

req.on('error', (err) => {
  console.error(`Health check failed: ${err.message}`)
  process.exit(1)
})

req.on('timeout', () => {
  console.error('Health check timeout')
  req.destroy()
  process.exit(1)
})

req.end()
