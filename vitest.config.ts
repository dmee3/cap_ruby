import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'happy-dom',
    setupFiles: './test/setup.ts',
    include: ['app/javascript/**/*.{test,spec}.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['app/javascript/**/*.{ts,tsx}'],
      exclude: [
        'app/javascript/**/*.{test,spec}.{ts,tsx}',
        'app/javascript/entrypoints/**/*',
      ]
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './app/javascript')
    }
  }
})
