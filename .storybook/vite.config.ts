import { defineConfig } from 'vite'
import path from 'path'

const sourceCodeDir = path.resolve(__dirname, '../app/javascript')

export default defineConfig({
  resolve: {
    alias: { '~': sourceCodeDir, '@': sourceCodeDir },
  },
})
