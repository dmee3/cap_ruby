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

  describe('variant="list"', () => {
    it('is edge-to-edge so rows can run full-bleed', () => {
      const { container } = render(
        <Card variant="list" title="Behind on payments">
          x
        </Card>,
      )
      const card = container.firstElementChild
      expect(card).toHaveClass('overflow-hidden')
      expect(card?.className).not.toMatch(/\bp-4\b/)
    })

    it('renders a sentence-case heading in a bordered header strip', () => {
      render(
        <Card variant="list" title="Behind on payments">
          x
        </Card>,
      )
      const title = screen.getByText('Behind on payments')
      expect(title).toHaveClass('text-h3', 'text-primary')
      expect(title.className).not.toMatch(/uppercase/)
      expect(title.parentElement).toHaveClass('border-b')
    })

    it('renders a secondary count beside the title and a right-aligned action', () => {
      render(
        <Card variant="list" title="Behind on payments" count="3 members" action={<a href="#">View all members</a>}>
          x
        </Card>,
      )
      expect(screen.getByText('3 members')).toHaveClass('text-secondary')
      expect(screen.getByRole('link', { name: 'View all members' }).parentElement).toHaveClass('ml-auto')
    })

    it('renders a subtitle on its own row', () => {
      render(
        <Card variant="list" title="Dues collected against plan" subtitle="summed weekly">
          x
        </Card>,
      )
      expect(screen.getByText('summed weekly')).toHaveClass('basis-full')
    })
  })

  it('can draw the tone on the whole border instead of a left rail', () => {
    const { container } = render(
      <Card tone="warning" borderTone>
        x
      </Card>,
    )
    const card = container.firstElementChild
    expect(card).toHaveClass('border-warning-fg')
    expect(card?.className).not.toMatch(/border-l-/)
  })
})
