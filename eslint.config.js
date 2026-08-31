import pluginVue from 'eslint-plugin-vue'
import { defineConfigWithVueTs, vueTsConfigs } from '@vue/eslint-config-typescript'
import skipFormatting from '@vue/eslint-config-prettier/skip-formatting'

export default defineConfigWithVueTs(
  {
    name: 'app/files',
    files: ['**/*.{ts,mts,tsx,vue}'],
  },

  {
    name: 'app/ignores',
    ignores: ['dist/**', 'coverage/**'],
  },

  pluginVue.configs['flat/recommended'],
  vueTsConfigs.recommended,

  // Prettier owns formatting. This turns off every stylistic rule that would
  // otherwise disagree with it, so `lint` reports real problems only.
  skipFormatting,
)
