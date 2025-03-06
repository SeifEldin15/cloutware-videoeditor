export default defineNuxtConfig({
  modules: ['@nuxt/eslint'],
  eslint: { config: { stylistic: true } },
  sourcemap: {
    server: true,
    client: true,
  },
})
