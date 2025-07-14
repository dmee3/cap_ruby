/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/views/**/*.{erb,html}',
    './app/javascript/**/*.{js,jsx,ts,tsx,scss}',
    './.storybook/**/*.{js,jsx,ts,tsx,scss}',
  ],
  theme: {
    extend: {
      colors: {
        ocean: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#386374',
          600: '#2d4f5d',
          700: '#223b46',
          800: '#172730',
          900: '#0c1319',
        },
      },
    },
  },
  plugins: [],
}
