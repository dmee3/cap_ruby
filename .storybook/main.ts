

/** @type { import('@storybook/react-vite').StorybookConfig } */
const config = {
  "stories": [
    "../app/javascript/**/*.stories.@(js|jsx|mjs|ts|tsx)"
  ],
  "addons": [
    "@storybook/addon-docs",
    "@storybook/addon-a11y"
  ],
  "framework": {
    "name": "@storybook/react-vite",
    "options": {}
  }
};
export default config;
