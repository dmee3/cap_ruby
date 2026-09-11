import React from 'react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, act, fireEvent } from '@testing-library/react'
import DecisionConfirm from './DecisionConfirm'

describe('DecisionConfirm', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  const baseProps = {
    outcome: 'Approved' as const,
    member: 'Marcus Webb',
    dateLabel: 'Fri 3/20 · 6:30–9:30 PM',
    onUndo: vi.fn(),
  }

  it('confirms the decision in place', () => {
    render(<DecisionConfirm {...baseProps} />)

    expect(screen.getByText(/Marcus Webb.s conflict is approved/i)).toBeInTheDocument()
    expect(screen.getByText('Fri 3/20 · 6:30–9:30 PM')).toBeInTheDocument()
  })

  it('offers an undo', () => {
    const onUndo = vi.fn()
    render(<DecisionConfirm {...baseProps} onUndo={onUndo} />)

    fireEvent.click(screen.getByRole('button', { name: 'Undo' }))

    expect(onUndo).toHaveBeenCalled()
  })

  // WCAG 2.2.1: the countdown must not be the only cue that a time limit exists.
  it('states the remaining time as text, not only as a bar', () => {
    render(<DecisionConfirm {...baseProps} duration={60000} />)

    expect(screen.getByRole('timer')).toHaveTextContent('60s to undo')
  })

  it('counts down', () => {
    render(<DecisionConfirm {...baseProps} duration={60000} />)

    act(() => {
      vi.advanceTimersByTime(5000)
    })

    expect(screen.getByRole('timer')).toHaveTextContent('55s to undo')
  })

  it('reports when the undo window closes so the row can leave the queue', () => {
    const onExpire = vi.fn()
    render(<DecisionConfirm {...baseProps} duration={1000} onExpire={onExpire} />)

    act(() => {
      vi.advanceTimersByTime(1200)
    })

    expect(onExpire).toHaveBeenCalledTimes(1)
  })

  it('shows a saving state instead of a countdown', () => {
    render(<DecisionConfirm {...baseProps} saving />)

    expect(screen.getByText('Saving your decision…')).toBeInTheDocument()
    expect(screen.queryByRole('timer')).not.toBeInTheDocument()
  })

  it('takes the blame on failure and says nothing was sent', () => {
    const onRetry = vi.fn()
    render(
      <DecisionConfirm
        {...baseProps}
        error="We couldn't save that one."
        onRetry={onRetry}
      />
    )

    expect(screen.getByRole('alert')).toBeInTheDocument()
    expect(screen.getByText('The row is back to Pending exactly as it was.')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Try again' }))
    expect(onRetry).toHaveBeenCalled()
  })

  it('does not run the countdown while saving or failed', () => {
    const onExpire = vi.fn()
    render(<DecisionConfirm {...baseProps} duration={500} saving onExpire={onExpire} />)

    act(() => {
      vi.advanceTimersByTime(2000)
    })

    expect(onExpire).not.toHaveBeenCalled()
  })

  it('renders a denied decision', () => {
    render(<DecisionConfirm {...baseProps} outcome="Denied" member="Jordan Pike" />)

    expect(screen.getByText(/Jordan Pike.s conflict is denied/i)).toBeInTheDocument()
  })
})
