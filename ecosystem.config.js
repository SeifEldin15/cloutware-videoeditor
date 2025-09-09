// Production PM2 Configuration
module.exports = {
  apps: [{
    name: 'video-processing',
    script: '.output/server/index.mjs',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000,
      NUXT_HOST: '0.0.0.0',
      NUXT_PORT: 3000
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    // Logging
    log_file: '/var/log/video-processing/combined.log',
    out_file: '/var/log/video-processing/out.log',
    error_file: '/var/log/video-processing/error.log',
    log_date_format: 'YYYY-MM-DD HH:mm Z',
    
    // Auto restart
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    
    // Advanced features
    instance_var: 'INSTANCE_ID',
    
    // Health monitoring
    min_uptime: '10s',
    max_restarts: 10,
    
    // Graceful shutdown
    kill_timeout: 5000,
    
    // Environment specific
    node_args: '--max-old-space-size=2048'
  }]
}
