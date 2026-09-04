import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import Pill from './Pill'

describe('Pill', () => {
  it('renders children', () => {
    render(<Pill>-$40</Pill>)
    expect(screen.getByText('-$40')).toBeInTheDocument()
  })

  it('defaults to the neutral tone', () => {
    const { container } = render(<Pill>x</Pill>)
    expect(container.querySelector('span')).toHaveClass('bg-neutral-bg', 'text-neutral-fg')
  })

  it('applies the requested tone', () => {
    const { container } = render(<Pill tone="danger">x</Pill>)
    expect(container.querySelector('span')).toHaveClass('bg-danger-bg', 'text-danger-fg')
  })

  it('renders a dot when asked', () => {
    const { container } = render(<Pill tone="success" dot>x</Pill>)
    expect(container.querySelector('span > span')).toHaveClass('bg-success-fg', 'rounded-full')
  })

  it('omits the dot by default', () => {
    const { container } = render(<Pill>x</Pill>)
    expect(container.querySelector('span > span')).toBeNull()
  })
})
