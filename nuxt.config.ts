export default defineNuxtConfig({
  modules: ['@nuxt/eslint', '@nuxtjs/tailwindcss'],
  eslint: { config: { stylistic: true } },

  devServer: {
    port: 3001,
  },

  sourcemap: {
    server: true,
    client: true,
  },

  css: ['~/assets/css/main.css'],

  compatibilityDate: '2025-03-25',
})