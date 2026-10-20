import type { StorybookConfig } from '@storybook/react-vite'

const config: StorybookConfig = {
  stories: ['../app/javascript/**/*.stories.@(ts|tsx)'],
  addons: ['@storybook/addon-docs', '@storybook/addon-a11y', 'msw-storybook-addon'],
  framework: {
    name: '@storybook/react-vite',
    // The app's vite.config.ts runs vite-plugin-ruby, which rewrites root and
    // base for Rails and has nothing to serve here.
    options: { builder: { viteConfigPath: '.storybook/vite.config.ts' } },
  },
  staticDirs: ['./public', { from: '../public/images', to: '/images' }],
}

export default config
