import { render, within, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect } from 'vitest'
import Toast from './Toast'

// `toast()` mounts a persistent module-level host that cannot be torn down
// between tests, so exercise the presentational <Toast> directly instead.
describe('<Toast>', () => {
  const item = { id: 1, message: 'Saved.', variant: 'info' as const, durationMs: 5000 }

  it('renders the message with the variant styling', () => {
    const { container } = render(<Toast item={item} onDismiss={() => {}} />)
    expect(within(container).getByText('Saved.')).toBeInTheDocument()
    expect(container.firstElementChild).toHaveClass('bg-ocean')
  })

  it('calls onDismiss when the close button is clicked', async () => {
    let dismissed: number | null = null
    const { container } = render(<Toast item={item} onDismiss={(id) => { dismissed = id }} />)
    await userEvent.click(within(container).getByRole('button', { name: 'Dismiss' }))
    expect(dismissed).toBe(1)
  })

  it('auto-dismisses once the duration elapses', async () => {
    let dismissed: number | null = null
    render(<Toast item={{ ...item, durationMs: 100 }} onDismiss={(id) => { dismissed = id }} />)
    await waitFor(() => expect(dismissed).toBe(1), { timeout: 1000 })
  })
})
