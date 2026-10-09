import { defineConfig, presetWind } from 'unocss'
import transformerDirectives from '@unocss/transformer-directives'
import { ORANGE } from './src/constants/palette'

export default defineConfig({
  presets: [presetWind()],
  transformers: [transformerDirectives()],
  shortcuts: {
    card: 'bg-white rounded-xl shadow-sm border border-gray-200 p-5',
    chip: 'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium',
    field: 'flex flex-col gap-1.5',
    skeleton: 'animate-pulse bg-gray-200 rounded-xl',
  },
  theme: {
    colors: {
      primary: { ...ORANGE },
    },
  },
})
