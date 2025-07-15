import '@/stylesheets/application.tailwind.css';
import '@/stylesheets/application.css';
import '@/react/design-system/styles.scss';

/** @type { import('@storybook/react-vite').Preview } */
const preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
  },
  tags: ['autodocs'],
};

export default preview;
