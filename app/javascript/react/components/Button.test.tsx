import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import Button from './Button'

describe('Button', () => {
  it('renders its label and fires onClick', async () => {
    const onClick = vi.fn()
    render(<Button onClick={onClick}>Pay dues</Button>)
    await userEvent.click(screen.getByRole('button', { name: 'Pay dues' }))
    expect(onClick).toHaveBeenCalledOnce()
  })

  it('applies the primary variant by default', () => {
    render(<Button>x</Button>)
    expect(screen.getByRole('button')).toHaveClass('bg-ocean')
  })

  it('applies a chosen variant and size', () => {
    render(<Button variant="danger" size="lg">Delete</Button>)
    const btn = screen.getByRole('button')
    expect(btn).toHaveClass('bg-raspberry', 'h-11')
  })

  it('is disabled and busy while loading, and does not fire onClick', async () => {
    const onClick = vi.fn()
    render(<Button loading onClick={onClick}>Save</Button>)
    const btn = screen.getByRole('button')
    expect(btn).toBeDisabled()
    expect(btn).toHaveAttribute('aria-busy', 'true')
    await userEvent.click(btn)
    expect(onClick).not.toHaveBeenCalled()
  })

  it('passes through the type attribute', () => {
    render(<Button type="submit">Go</Button>)
    expect(screen.getByRole('button')).toHaveAttribute('type', 'submit')
  })
})
