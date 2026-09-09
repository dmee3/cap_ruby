import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import BurndownChart from './BurndownChart'

const scheduled: [string, number][] = [
  ['2026-01-04', 0],
  ['2026-01-11', 300],
  ['2026-01-18', 500],
  ['2026-01-25', 800],
]
const actual: [string, number][] = [
  ['2026-01-04', 0],
  ['2026-01-11', 250],
  ['2026-01-18', 300],
]

describe('BurndownChart', () => {
  it('renders the no-data state with a setup link when there is no schedule', () => {
    render(<BurndownChart scheduled={[]} actual={[]} today="2026-01-18" setupHref="/admin/users" />)
    expect(screen.getByText('No dues scheduled for this season yet')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Set up payment schedules' })).toHaveAttribute(
      'href',
      '/admin/users',
    )
  })

  it('plots two polylines and an end dot for the collected line', () => {
    const { container } = render(
      <BurndownChart scheduled={scheduled} actual={actual} today="2026-01-18" />,
    )
    expect(container.querySelectorAll('polyline')).toHaveLength(2)
    expect(container.querySelector('circle')).toBeInTheDocument()
  })

  it('names the behind-schedule amount in the caption and the aria-label', () => {
    render(<BurndownChart scheduled={scheduled} actual={actual} today="2026-01-18" />)
    // scheduled at 1/18 is $500, collected $300 → $200 behind
    expect(screen.getByText('$200 behind schedule')).toBeInTheDocument()
    expect(screen.getByRole('img').getAttribute('aria-label')).toMatch(/\$200 behind schedule/)
  })

  it('uses a pattern fill (not colour alone) for the behind-schedule band', () => {
    const { container } = render(
      <BurndownChart scheduled={scheduled} actual={actual} today="2026-01-18" />,
    )
    expect(container.querySelector('pattern')).toBeInTheDocument()
    const poly = container.querySelector('polygon')
    expect(poly?.getAttribute('fill')).toMatch(/^url\(#/)
  })

  it('says collections are keeping pace when not behind', () => {
    const evenActual: [string, number][] = [
      ['2026-01-04', 0],
      ['2026-01-11', 300],
      ['2026-01-18', 520],
    ]
    render(<BurndownChart scheduled={scheduled} actual={evenActual} today="2026-01-18" />)
    expect(screen.getByText(/keeping pace with the plan/)).toBeInTheDocument()
  })

  it('draws a Today marker', () => {
    render(<BurndownChart scheduled={scheduled} actual={actual} today="2026-01-18" />)
    expect(screen.getByText('Today')).toBeInTheDocument()
  })
})
