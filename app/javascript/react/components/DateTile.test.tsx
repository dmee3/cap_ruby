import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import DateTile from './DateTile'

describe('DateTile', () => {
  it('shows the day number over what sponsoring it costs', () => {
    render(<DateTile date={17} state="available" />)

    expect(screen.getByText('17')).toBeInTheDocument()
    expect(screen.getByText('$17')).toBeInTheDocument()
  })

  it('names what it does, rather than leaving a reader to parse "7 $7"', () => {
    render(<DateTile date={7} state="available" />)

    expect(screen.getByRole('button', { name: 'Sponsor the 7th for $7' })).toBeInTheDocument()
  })

  it('gets the ordinal right for the awkward numbers', () => {
    render(
      <>
        <DateTile date={1} state="available" />
        <DateTile date={2} state="available" />
        <DateTile date={3} state="available" />
        <DateTile date={11} state="available" />
        <DateTile date={22} state="available" />
      </>,
    )

    expect(screen.getByRole('button', { name: /the 1st/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /the 2nd/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /the 3rd/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /the 11th/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /the 22nd/ })).toBeInTheDocument()
  })

  it('marks a selected tile pressed and checks it', () => {
    render(<DateTile date={3} state="selected" />)

    expect(screen.getByRole('button')).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByText('✓ $3')).toBeInTheDocument()
  })

  // Never color alone: the word "taken" is the cue. The strikethrough the
  // design originally carried was dropped, so the word has to stay.
  it('labels a claimed date "taken" in words', () => {
    const { container } = render(<DateTile date={9} state="taken" />)

    expect(screen.getByText('taken')).toBeInTheDocument()
    expect(container.querySelector('button')).not.toHaveClass('line-through')
  })

  it('makes a taken date unfocusable, since there is nothing to do with it', () => {
    render(<DateTile date={9} state="taken" />)

    expect(screen.getByRole('button')).toBeDisabled()
  })

  it('reports the date when toggled', async () => {
    const onToggle = vi.fn()
    render(<DateTile date={12} state="available" onToggle={onToggle} />)

    await userEvent.click(screen.getByRole('button'))

    expect(onToggle).toHaveBeenCalledWith(12)
  })

  it('does not toggle a taken date', async () => {
    const onToggle = vi.fn()
    render(<DateTile date={12} state="taken" onToggle={onToggle} />)

    await userEvent.click(screen.getByRole('button'))

    expect(onToggle).not.toHaveBeenCalled()
  })

  // 44px is the touch-target floor on the phone layout.
  it('keeps a 44px minimum when compact', () => {
    const { container } = render(<DateTile date={1} state="available" compact />)

    expect(container.querySelector('button')).toHaveClass('min-h-[44px]')
  })
})
