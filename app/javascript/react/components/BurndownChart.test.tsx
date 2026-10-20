import { fireEvent, render, screen } from '@testing-library/react'
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
  it('shows a message instead of an empty plot when there is nothing in range', () => {
    render(<BurndownChart scheduled={[]} actual={[]} today="2026-01-18" />)
    expect(screen.getByText('Nothing has been paid yet')).toBeInTheDocument()
    expect(screen.queryByRole('img')).not.toBeInTheDocument()
  })

  it('plots two polylines and an end dot for the collected line', () => {
    const { container } = render(
      <BurndownChart scheduled={scheduled} actual={actual} today="2026-01-18" />,
    )
    expect(container.querySelectorAll('polyline')).toHaveLength(2)
    expect(container.querySelector('circle')).toBeInTheDocument()
  })

  it('names the shortfall in the caption and the aria-label', () => {
    render(<BurndownChart scheduled={scheduled} actual={actual} today="2026-01-18" />)
    // scheduled at 1/18 is $500, collected $300 → $200 short
    expect(screen.getByText('$200 short of the plan')).toBeInTheDocument()
    expect(screen.getByRole('img').getAttribute('aria-label')).toMatch(/\$200 behind schedule/)
  })

  it('can hide the caption while keeping it available to screen readers', () => {
    render(
      <BurndownChart scheduled={scheduled} actual={actual} today="2026-01-18" showCaption={false} />,
    )
    expect(screen.getByText('$200 short of the plan').closest('p')).toHaveClass('hidden')
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

  it('marks the season end instead of today once the season has passed', () => {
    render(
      <BurndownChart scheduled={scheduled} actual={actual} today="2026-09-17" asOf="2026-01-25" />,
    )
    expect(screen.getByText('Season end')).toBeInTheDocument()
    expect(screen.queryByText('Today')).not.toBeInTheDocument()
  })

  it('measures the shortfall as of the season end, not as of today', () => {
    render(
      <BurndownChart scheduled={scheduled} actual={actual} today="2026-09-17" asOf="2026-01-18" />,
    )
    expect(screen.getByText('$200 short of the plan')).toBeInTheDocument()
  })

  it('footnotes money collected after the season rather than plotting it', () => {
    render(
      <BurndownChart
        scheduled={scheduled}
        actual={actual}
        today="2026-09-17"
        asOf="2026-01-25"
        afterCutoff={{ cents: 331_500, count: 8, after: '2026-01-25' }}
      />,
    )
    expect(screen.getByText(/Collected after the season/)).toBeInTheDocument()
    expect(screen.getByText('$3,315')).toBeInTheDocument()
    expect(screen.getByText(/8 payments/)).toBeInTheDocument()
  })

  it('keeps the after-season footnote visible when the caption is hidden', () => {
    render(
      <BurndownChart
        scheduled={scheduled}
        actual={actual}
        today="2026-09-17"
        asOf="2026-01-25"
        showCaption={false}
        afterCutoff={{ cents: 331_500, count: 8, after: '2026-01-25' }}
      />,
    )
    expect(screen.getByText(/Collected after the season/).closest('p')).not.toHaveClass('hidden')
  })

  it('omits the footnote when nothing landed after the season', () => {
    render(
      <BurndownChart
        scheduled={scheduled}
        actual={actual}
        today="2026-01-18"
        afterCutoff={{ cents: 0, count: 0, after: '2026-01-25' }}
      />,
    )
    expect(screen.queryByText(/Collected after the season/)).not.toBeInTheDocument()
  })
  describe('hover readout', () => {
    // jsdom has no layout; pretend the SVG renders at its viewBox size so a
    // clientX is a viewBox x. The plot spans 56..700 across Jan 4..Jan 25.
    const hoverAt = (clientX: number) => {
      const svg = screen.getByRole('img')
      svg.getBoundingClientRect = () => ({ left: 0, width: 720 }) as DOMRect
      fireEvent.pointerMove(svg, { clientX })
    }

    it('snaps to the nearest sample and reads out both lines there', () => {
      render(<BurndownChart scheduled={scheduled} actual={actual} today="2026-01-18" />)
      // Jan 11 sits at x≈271; 300 is nearer it than Jan 18 (≈485).
      hoverAt(300)
      const readout = screen.getByRole('status')
      expect(readout).toHaveTextContent('$300Scheduled')
      expect(readout).toHaveTextContent('$250Collected')
    })

    it('has no collected figure past the end of the collected line', () => {
      render(<BurndownChart scheduled={scheduled} actual={actual} today="2026-01-18" />)
      hoverAt(700)
      const readout = screen.getByRole('status')
      expect(readout).toHaveTextContent('$800Scheduled')
      expect(readout).toHaveTextContent('—Collected')
    })

    it('steps through samples from the keyboard', () => {
      render(<BurndownChart scheduled={scheduled} actual={actual} today="2026-01-18" />)
      const svg = screen.getByRole('img')
      fireEvent.keyDown(svg, { key: 'ArrowRight' })
      fireEvent.keyDown(svg, { key: 'ArrowRight' })
      expect(screen.getByRole('status')).toHaveTextContent('$300Scheduled')
      fireEvent.keyDown(svg, { key: 'Escape' })
      expect(screen.queryByRole('status')).not.toBeInTheDocument()
    })
  })
})
