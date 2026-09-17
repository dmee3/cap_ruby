import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import CopyButton from './CopyButton'

const stubClipboard = (writeText: () => Promise<void>) => {
  Object.defineProperty(navigator, 'clipboard', {
    value: { writeText },
    configurable: true,
    writable: true,
  })
}

describe('CopyButton', () => {
  beforeEach(() => {
    vi.useRealTimers()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('puts the value on the clipboard', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    stubClipboard(writeText)

    render(<CopyButton value="marcus@example.com" label="Copy email" />)
    await userEvent.click(screen.getByRole('button'))

    expect(writeText).toHaveBeenCalledWith('marcus@example.com')
  })

  it('names the value it copies, so a row of them stay distinguishable', () => {
    stubClipboard(vi.fn().mockResolvedValue(undefined))

    render(<CopyButton value="elena@example.com" label="Copy email" />)

    expect(screen.getByRole('button', { name: 'Copy email: elena@example.com' })).toBeInTheDocument()
  })

  it('confirms the copy where it happened', async () => {
    stubClipboard(vi.fn().mockResolvedValue(undefined))

    render(<CopyButton value="marcus@example.com" label="Copy email" />)
    await userEvent.click(screen.getByRole('button'))

    await waitFor(() => expect(screen.getByText('Copied')).toBeInTheDocument())
  })

  it('says so when the clipboard refuses rather than claiming a copy', async () => {
    stubClipboard(vi.fn().mockRejectedValue(new Error('denied')))

    render(<CopyButton value="marcus@example.com" label="Copy email" />)
    await userEvent.click(screen.getByRole('button'))

    await waitFor(() => expect(screen.getByText('Press Ctrl+C')).toBeInTheDocument())
    expect(screen.queryByText('Copied')).not.toBeInTheDocument()
  })

  it('survives a browser with no clipboard API at all', async () => {
    Object.defineProperty(navigator, 'clipboard', {
      value: undefined,
      configurable: true,
      writable: true,
    })

    render(<CopyButton value="marcus@example.com" label="Copy email" />)
    await userEvent.click(screen.getByRole('button'))

    await waitFor(() => expect(screen.getByText('Press Ctrl+C')).toBeInTheDocument())
  })
})
