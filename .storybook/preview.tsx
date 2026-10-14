import React from 'react'
import type { Preview } from '@storybook/react-vite'
import { action } from 'storybook/actions'
import { setupWorker } from 'msw/browser'
import { mswLoader } from 'msw-storybook-addon/csf3'

import '../app/javascript/stylesheets/application.css'

const csrf = document.createElement('meta')
csrf.name = 'csrf-token'
csrf.content = 'storybook'
document.head.appendChild(csrf)

const logSubmit = action('form submit')

// Several widgets are plain <form method="post"> to a Rails action. Posting
// for real would navigate the preview iframe away from the story, so the
// fields land in the Actions panel instead.
const captureSubmit = (event: React.FormEvent<HTMLDivElement>) => {
  const form = event.target as HTMLFormElement
  event.preventDefault()
  logSubmit(form.getAttribute('action'), Object.fromEntries(new FormData(form).entries()))
}

const preview: Preview = {
  // Widgets talk to Rails through fetch; a story answers with handlers in
  // `parameters.msw`. Anything it doesn't handle warns in the console rather
  // than failing silently against a server that isn't there.
  loaders: [
    mswLoader(async () => {
      const worker = setupWorker()
      await worker.start({ quiet: true, onUnhandledRequest: 'warn' })
      return worker
    }),
  ],
  decorators: [
    (Story) => (
      <div onSubmitCapture={captureSubmit}>
        <Story />
      </div>
    ),
  ],
  parameters: {
    layout: 'padded',
  },
}

export default preview
