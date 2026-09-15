import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, afterEach } from 'vitest'
import ShareCalendar from './ShareCalendar'

const url = 'https://members.capcitypercussion.com/f/k7m2xq'

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('ShareCalendar', () => {
  it('names whose calendar it shares', () => {
    render(<ShareCalendar shareUrl={url} firstName="Elena" />)

    expect(screen.getByRole('button', { name: "Share Elena's calendar" })).toBeInTheDocument()
  })

  // This page is mostly seen on a phone, arriving from a shared link.
  it('uses the native share sheet when there is one', async () => {
    const share = vi.fn().mockResolvedValue(undefined)
    vi.stubGlobal('navigator', { share })

    render(<ShareCalendar shareUrl={url} firstName="Elena" />)
    await userEvent.click(screen.getByRole('button'))

    expect(share).toHaveBeenCalledWith(expect.objectContaining({ url }))
  })

  it('falls back to copying the link', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    vi.stubGlobal('navigator', { clipboard: { writeText } })

    render(<ShareCalendar shareUrl={url} firstName="Elena" />)
    await userEvent.click(screen.getByRole('button'))

    expect(writeText).toHaveBeenCalledWith(url)
    expect(await screen.findByText('Link copied')).toBeInTheDocument()
  })

  it('copies when the donor dismisses the share sheet', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    vi.stubGlobal('navigator', {
      share: vi.fn().mockRejectedValue(new Error('dismissed')),
      clipboard: { writeText },
    })

    render(<ShareCalendar shareUrl={url} firstName="Elena" />)
    await userEvent.click(screen.getByRole('button'))

    expect(writeText).toHaveBeenCalledWith(url)
  })

  it('stays quiet rather than lying when the clipboard is blocked', async () => {
    vi.stubGlobal('navigator', {
      clipboard: { writeText: vi.fn().mockRejectedValue(new Error('denied')) },
    })

    render(<ShareCalendar shareUrl={url} firstName="Elena" />)
    await userEvent.click(screen.getByRole('button'))

    expect(screen.queryByText('Link copied')).toBeNull()
  })
})
