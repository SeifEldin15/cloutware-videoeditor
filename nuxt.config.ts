export default defineNuxtConfig({
  modules: ['@nuxt/eslint'],
  eslint: { config: { stylistic: true } },

  devServer: {
  port: 3000,
  },

  sourcemap: {
    server: true,
    client: true,
  },

  css: ['~/assets/css/main.css'],

  postcss: {
    plugins: {
      '@tailwindcss/postcss': {},
      autoprefixer: {},
    },
  },

  nitro: {
    externals: {
      external: [
        'tesseract.js',
        'sharp',
        'fluent-ffmpeg',
        '@ffmpeg-installer/ffmpeg',
        '@ffprobe-installer/ffprobe',
      ]
    },
    rollupConfig: {
      external: [
        'tesseract.js',
        'sharp',
        'fluent-ffmpeg',
        '@ffmpeg-installer/ffmpeg',
        '@ffprobe-installer/ffprobe',
      ]
    }
  },

  compatibilityDate: '2025-03-25',
})