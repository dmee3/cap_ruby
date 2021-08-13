const colors = require('tailwindcss/colors')

module.exports = {
  purge: [
    "./app/**/*.html.erb",
    "./app/helpers/**/*.rb",
    "./app/javascript/**/*.js",
    "./app/javascript/**/*.vue",
  ],
  darkMode: 'media', // or 'media' or 'class'
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
        teal: {
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
          DEFAULT: '#323337',
          light: '#4e4f56',
          lightest: '#747781',
        },
        mint: {
          DEFAULT: '#e7f1f0'
        }
      }
    },
  },
  variants: {
    extend: {},
  },
  plugins: [
    require('@tailwindcss/forms')
  ],
}
