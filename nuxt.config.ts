export default defineNuxtConfig({
  modules: ['@nuxt/eslint', '@nuxtjs/tailwindcss'],
  eslint: { config: { stylistic: true } },

  sourcemap: {
    server: true,
    client: true,
  },

  css: ['~/assets/css/main.css'],

  compatibilityDate: '2025-03-25',
})