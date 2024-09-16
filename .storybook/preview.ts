import type { Preview, ReactRenderer } from '@storybook/react'
import { withThemeByClassName } from "@storybook/addon-themes"

import 'virtual:windi.css'
import '~/stylesheets/application.css'
import './storybook.css'

const preview: Preview = {
  parameters: {
    actions: { argTypesRegex: '^on[A-Z].*' },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    layout: "centered",
  },
  decorators: [
    withThemeByClassName<ReactRenderer>({
      themes: {
        light: "",
        dark: "dark",
      },
      defaultTheme: "light",
    }),
  ]
}

export default preview
