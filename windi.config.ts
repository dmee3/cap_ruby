import { defineConfig } from 'windicss/helpers'
import colors from 'windicss/colors'
import plugin from 'windicss/plugin'
import forms from 'windicss/plugin/forms'

export default defineConfig({
  // Toggle dark-mode based on .dark class or data-mode="dark"
  // darkMode: ['class', '[data-mode="dark"]'],
  darkMode: 'media',
  theme: {
    extend: {
      transitionDuration: {
        DEFAULT: '200ms'
      },
      colors: {
        raspberry: {
          dark: '#962231',
          DEFAULT: '#cc2f44',
          light: '#d9596a',
          lightest: '#e89b86'
        },
        ocean: {
          dark: '#213b45',
          DEFAULT: '#386374',
          light: '#498197',
          lightest: '#68a0b6',
        },
        moss: {
          dark: '#60683c',
          DEFAULT: '#8b9556',
          light: '#a3ad71',
          lightest: '#c4cba4'
        },
        jet: {
          DEFAULT: '#1d1e20'
        },
        flash: {
          DEFAULT: '#e9ebec'
        }
      }
    },
  },
  plugins: [forms],
  variants: {
    extend: {
      opacity: ['disabled'],
    }
  }
})
