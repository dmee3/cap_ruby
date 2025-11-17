import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import Badge from './Badge'

describe('Badge', () => {
  it('renders badge text', () => {
    render(<Badge text="Approved" color="green" />)
    expect(screen.getByText('Approved')).toBeInTheDocument()
  })

  it('applies green color classes', () => {
    const { container } = render(<Badge text="Approved" color="green" />)
    const badge = container.querySelector('span')
    expect(badge).toHaveClass('bg-green-100')
    expect(badge).toHaveClass('text-green-600')
  })

  it('applies red color classes', () => {
    const { container } = render(<Badge text="Denied" color="red" />)
    const badge = container.querySelector('span')
    expect(badge).toHaveClass('bg-red-100')
    expect(badge).toHaveClass('text-red-600')
  })

  it('applies yellow color classes', () => {
    const { container } = render(<Badge text="Pending" color="yellow" />)
    const badge = container.querySelector('span')
    expect(badge).toHaveClass('bg-yellow-100')
    expect(badge).toHaveClass('text-yellow-600')
  })

  it('applies gray color classes', () => {
    const { container } = render(<Badge text="Archived" color="gray" />)
    const badge = container.querySelector('span')
    expect(badge).toHaveClass('bg-gray-100')
    expect(badge).toHaveClass('text-gray-600')
  })

  it('applies correct styling classes', () => {
    const { container } = render(<Badge text="Test" color="green" />)
    const badge = container.querySelector('span')
    expect(badge).toHaveClass('rounded-full')
    expect(badge).toHaveClass('text-sm')
    expect(badge).toHaveClass('font-medium')
    expect(badge).toHaveClass('px-3')
    expect(badge).toHaveClass('py-1')
  })
})
