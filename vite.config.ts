import { defineConfig } from 'vite'
import RubyPlugin from 'vite-plugin-ruby'
import ReactRefresh from '@vitejs/plugin-react-refresh'
import FullReload from 'vite-plugin-full-reload'
import WindiCSS from 'vite-plugin-windicss'

export default defineConfig({
  plugins: [
    RubyPlugin(),
    FullReload(['config/routes.rb', 'app/views/**/*'], { delay: 200 }),
    ReactRefresh(),
    WindiCSS({
      root: __dirname,
      scan: {
        fileExtensions: ['erb', 'html', 'vue', 'jsx', 'tsx'], // and maybe haml
        dirs: ['app/views', 'app/frontend'], // or app/javascript
      },
    }),
  ],
  build: {
    sourcemap: true,
  },
})
