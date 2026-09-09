import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect } from 'vitest'
import PaginatedList from './PaginatedList'

const items = Array.from({ length: 12 }, (_, i) => ({ id: i, label: `Row ${i}` }))

describe('PaginatedList', () => {
  it('renders the empty state when there are no items', () => {
    render(
      <PaginatedList
        items={[]}
        keyFor={(x: { id: number }) => x.id}
        renderItem={() => null}
        emptyTitle="Nothing here"
        emptyBody="Come back later"
      />,
    )
    expect(screen.getByText('Nothing here')).toBeInTheDocument()
  })

  it('shows one page, then reveals more on click', async () => {
    render(
      <PaginatedList
        items={items}
        pageSize={5}
        keyFor={(x) => x.id}
        renderItem={(x) => <span>{x.label}</span>}
        emptyTitle="x"
      />,
    )
    expect(screen.getByText('Row 4')).toBeInTheDocument()
    expect(screen.queryByText('Row 5')).not.toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Load 5 more' }))
    expect(screen.getByText('Row 9')).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Load 2 more' }))
    expect(screen.getByText('Row 11')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Showing all 12' })).toBeDisabled()
  })

  it('shows no pager when everything fits in one page', () => {
    render(
      <PaginatedList
        items={items.slice(0, 3)}
        pageSize={5}
        keyFor={(x) => x.id}
        renderItem={(x) => <span>{x.label}</span>}
        emptyTitle="x"
      />,
    )
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })
})
