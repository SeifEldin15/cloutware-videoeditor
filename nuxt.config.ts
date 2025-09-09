export default defineNuxtConfig({
  modules: ['@nuxt/eslint'],
  eslint: { config: { stylistic: true } },

  sourcemap: {
    server: true,
    client: true,
  },

  // HTTPS Configuration for Development
  devServer: {
    https: {
      key: './certs/localhost.key',
      cert: './certs/localhost.crt'
    },
    host: '0.0.0.0',
    port: 3000
  },

  // Security Headers
  routeRules: {
    '/**': {
      headers: {
        'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'X-XSS-Protection': '1; mode=block'
      }
    }
  },

  compatibilityDate: '2025-03-25',
})