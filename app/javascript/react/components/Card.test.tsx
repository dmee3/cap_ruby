import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import Card from './Card'

describe('Card', () => {
  it('renders children', () => {
    render(<Card>body</Card>)
    expect(screen.getByText('body')).toBeInTheDocument()
  })

  it('renders a title and action', () => {
    render(<Card title="Dues progress" action={<a href="#">More</a>}>x</Card>)
    expect(screen.getByText('Dues progress')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'More' })).toBeInTheDocument()
  })

  it('can render as a section', () => {
    const { container } = render(<Card as="section">x</Card>)
    expect(container.firstElementChild?.tagName).toBe('SECTION')
  })

  describe('variant="list"', () => {
    it('renders a title, a secondary count and an action', () => {
      render(
        <Card variant="list" title="Behind on payments" count="3 members" action={<a href="#">View all members</a>}>
          x
        </Card>,
      )
      expect(screen.getByText('Behind on payments')).toBeInTheDocument()
      expect(screen.getByText('3 members')).toBeInTheDocument()
      expect(screen.getByRole('link', { name: 'View all members' })).toBeInTheDocument()
    })

    it('renders a subtitle when given', () => {
      render(
        <Card variant="list" title="Dues collected against plan" subtitle="summed weekly">
          x
        </Card>,
      )
      expect(screen.getByText('summed weekly')).toBeInTheDocument()
    })
  })

  describe('variant="section"', () => {
    it('renders the title and an action beside it', () => {
      render(
        <Card variant="section" title="Heading" action={<span>$500 paid</span>}>
          x
        </Card>,
      )
      expect(screen.getByText('Heading')).toBeInTheDocument()
      expect(screen.getByText('$500 paid')).toBeInTheDocument()
    })
  })
})
