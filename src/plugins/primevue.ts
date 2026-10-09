import { definePreset } from '@primevue/themes'
import Aura from '@primevue/themes/aura'
import { ORANGE } from '../constants/palette'

export const KitchenPreset = definePreset(Aura, {
  semantic: {
    primary: { ...ORANGE },
    colorScheme: {
      light: {
        surface: {
          0: '#ffffff',
          50: '#f9fafb',
          100: '#f3f4f6',
          200: '#e5e7eb',
          300: '#d1d5db',
          400: '#9ca3af',
          500: '#6b7280',
          600: '#4b5563',
          700: '#374151',
          800: '#1f2937',
          900: '#111827',
        },
      },
    },
  },
  components: {
    dialog: {
      colorScheme: {
        light: {
          root: { borderRadius: '0.75rem' },
          header: {
            padding: '1.25rem 1.5rem',
            borderColor: '{content.border.color}',
          },
          content: { padding: '1.5rem' },
          footer: {
            padding: '1rem 1.5rem',
            borderColor: '{content.border.color}',
            gap: '0.5rem',
            justifyContent: 'flex-end',
          },
        },
      },
    },
  },
})
