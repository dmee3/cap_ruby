import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import Card from './Card'

describe('Card', () => {
  it('renders children', () => {
    render(<Card>body</Card>)
    expect(screen.getByText('body')).toBeInTheDocument()
  })

  it('renders a title kicker and action', () => {
    render(<Card title="Dues progress" action={<a href="#">More</a>}>x</Card>)
    expect(screen.getByText('Dues progress')).toHaveClass('text-label')
    expect(screen.getByRole('link', { name: 'More' })).toBeInTheDocument()
  })

  it('has a flat surface with a border by default, no tone accent', () => {
    const { container } = render(<Card>x</Card>)
    const card = container.firstElementChild
    expect(card).toHaveClass('bg-surface', 'border', 'rounded-md')
    expect(card?.className).not.toMatch(/border-l-/)
  })

  it('adds a left accent for a tone', () => {
    const { container } = render(<Card tone="danger">x</Card>)
    expect(container.firstElementChild).toHaveClass('border-l-danger-fg')
  })

  it('can render as a section', () => {
    const { container } = render(<Card as="section">x</Card>)
    expect(container.firstElementChild?.tagName).toBe('SECTION')
  })
})
