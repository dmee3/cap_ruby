import { render } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import Skeleton from './Skeleton'

describe('Skeleton', () => {
  it('renders the default number of shimmer rows', () => {
    const { container } = render(<Skeleton />)
    expect(container.querySelectorAll('.animate-pulse')).toHaveLength(4)
  })

  it('honours a custom row count', () => {
    const { container } = render(<Skeleton rows={7} />)
    expect(container.querySelectorAll('.animate-pulse')).toHaveLength(7)
  })

  it('is hidden from assistive tech', () => {
    const { container } = render(<Skeleton />)
    expect(container.firstElementChild).toHaveAttribute('aria-hidden', 'true')
  })
})
