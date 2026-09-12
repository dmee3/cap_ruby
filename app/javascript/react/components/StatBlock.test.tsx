import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import StatBlock from './StatBlock'

describe('StatBlock', () => {
  it('renders the kicker, metric and context', () => {
    render(<StatBlock kicker="Collected" metric="$9,420" context="of $12,600" />)
    expect(screen.getByText('Collected')).toBeInTheDocument()
    expect(screen.getByText('$9,420')).toBeInTheDocument()
    expect(screen.getByText('of $12,600')).toBeInTheDocument()
  })

  it('shows a trend chip next to the metric', () => {
    render(<StatBlock kicker="Days late" metric="9 days" trend="▲ 3 vs last month" />)
    expect(screen.getByText('▲ 3 vs last month')).toBeInTheDocument()
  })

  it('colours the metric by an explicit tone', () => {
    render(<StatBlock kicker="x" metric="1" tone="success" />)
    expect(screen.getByText('1')).toHaveClass('text-success-fg')
  })

  it('bands the tone by threshold: 0 is success', () => {
    render(<StatBlock kicker="Behind" metric="0" threshold={0} />)
    expect(screen.getByText('0')).toHaveClass('text-success-fg')
  })

  it('bands the tone by threshold: 1–4 is warning', () => {
    render(<StatBlock kicker="Behind" metric="3" threshold={3} />)
    expect(screen.getByText('3')).toHaveClass('text-warning-fg')
  })

  it('bands the tone by threshold: 5+ is danger, overriding any tone prop', () => {
    render(<StatBlock kicker="Behind" metric="6" tone="success" threshold={6} />)
    expect(screen.getByText('6')).toHaveClass('text-danger-fg')
  })
})
