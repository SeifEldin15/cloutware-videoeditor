// @ts-check
import antfu from '@antfu/eslint-config'
import nuxt from './.nuxt/eslint.config.mjs'

export default nuxt(
  await antfu({
    unocss: true,
    formatters: true,
    rules: {
      'node/prefer-global/process': 'off',
      'antfu/if-newline': 'off',
      'style/semi': ['error', 'never'],
      'prefer-destructuring': ['error', { array: true, object: true }],
      'unocss/order-attributify': 'error',
      'unocss/order': 'error',
      'style/no-extra-semi': ['error'],
      'import/newline-after-import': 'error',
      'import/order': 'off',
      'vue/max-attributes-per-line': ['error', { multiline: 6, singleline: 999 }],
      'vue/singleline-html-element-content-newline': ['off'],
      'vue/multi-word-component-names': 'off',
      'vue/no-template-shadow': 'off',
      'vue/component-name-in-template-casing': ['error', 'kebab-case', {
        registeredComponentsOnly: false,
        ignores: ['Switch', 'Pane', 'Splitpanes', 'Icon', 'Title', 'Base', 'Style', 'Meta', 'Link', 'Body', 'Html', 'Head'],
      }],
    },
    stylistic: true,
  },
  ),
)
