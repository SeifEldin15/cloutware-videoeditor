export default defineNuxtConfig({
  modules: ['@nuxt/eslint'],
  eslint: { config: { stylistic: true } },

  devServer: {
  port: 3001,
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

  compatibilityDate: '2025-03-25',
})