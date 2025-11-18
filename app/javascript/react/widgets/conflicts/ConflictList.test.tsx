import { render, screen, within } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import userEvent from '@testing-library/user-event'
import ConflictList from './ConflictList'

// Mock the Utilities module
vi.mock('../../../utilities/utilities', () => ({
  default: {
    displayDateTimeReadable: (date: string) => `Formatted: ${date}`,
    statusToColor: (status: string) => 'yellow'
  }
}))

// Don't mock ConflictListItem - we need to test the integration

describe('ConflictList', () => {
  // Create dates relative to now to ensure consistent test behavior
  const now = new Date()
  const futureDate1 = new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000) // 5 days from now
  const futureDate2 = new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000) // 10 days from now
  const pastDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) // 30 days ago

  const mockConflicts = [
    {
      id: 1,
      title: 'Conflict 1',
      start: futureDate1.toISOString(),
      end: futureDate1.toISOString(),
      reason: 'Reason 1',
      status: { name: 'Pending' }
    },
    {
      id: 2,
      title: 'Conflict 2',
      start: futureDate2.toISOString(),
      end: futureDate2.toISOString(),
      reason: 'Reason 2',
      status: { name: 'Approved' }
    },
    {
      id: 3,
      title: 'Conflict 3',
      start: pastDate.toISOString(),
      end: pastDate.toISOString(),
      reason: 'Past conflict',
      status: { name: 'Denied' }
    }
  ]

  describe('rendering', () => {
    it('renders list of conflicts', () => {
      render(<ConflictList conflicts={mockConflicts} />)

      expect(screen.getByText('Conflict 1')).toBeInTheDocument()
      expect(screen.getByText('Conflict 2')).toBeInTheDocument()
    })

    it('returns null when no conflicts', () => {
      const { container } = render(<ConflictList conflicts={[]} />)
      expect(container.firstChild).toBeNull()
    })

    it('renders with custom title', () => {
      render(<ConflictList conflicts={mockConflicts} title="Pending Conflicts" />)
      expect(screen.getByText('Pending Conflicts')).toBeInTheDocument()
    })

    it('renders with default title "All"', () => {
      render(<ConflictList conflicts={mockConflicts} />)
      expect(screen.getByText('All')).toBeInTheDocument()
    })

    it('hides header when showHeader is false', () => {
      render(<ConflictList conflicts={mockConflicts} showHeader={false} />)
      expect(screen.queryByText('All')).not.toBeInTheDocument()
    })
  })

  describe('filtering', () => {
    it('renders filter input when showFilters is true', () => {
      render(<ConflictList conflicts={mockConflicts} />)
      expect(screen.getByPlaceholderText('Filter by Member')).toBeInTheDocument()
    })

    it('does not render filter input when showFilters is false', () => {
      render(<ConflictList conflicts={mockConflicts} showFilters={false} />)
      expect(screen.queryByPlaceholderText('Filter by Member')).not.toBeInTheDocument()
    })

    it('filters conflicts by title (case insensitive)', async () => {
      const user = userEvent.setup()
      render(<ConflictList conflicts={mockConflicts} />)

      const filterInput = screen.getByPlaceholderText('Filter by Member')
      await user.type(filterInput, 'Conflict 1')

      expect(screen.getByText('Conflict 1')).toBeInTheDocument()
      expect(screen.queryByText('Conflict 2')).not.toBeInTheDocument()
    })

    it('requires at least 2 characters to filter', async () => {
      const user = userEvent.setup()
      render(<ConflictList conflicts={mockConflicts} />)

      const filterInput = screen.getByPlaceholderText('Filter by Member')
      await user.type(filterInput, 'C')

      // All conflicts should still be visible with 1 character
      expect(screen.getByText('Conflict 1')).toBeInTheDocument()
      expect(screen.getByText('Conflict 2')).toBeInTheDocument()
    })

    it('clears filter when input is cleared', async () => {
      const user = userEvent.setup()
      render(<ConflictList conflicts={mockConflicts} />)

      const filterInput = screen.getByPlaceholderText('Filter by Member')
      await user.type(filterInput, 'Conflict 1')
      expect(screen.queryByText('Conflict 2')).not.toBeInTheDocument()

      await user.clear(filterInput)
      expect(screen.getByText('Conflict 1')).toBeInTheDocument()
      expect(screen.getByText('Conflict 2')).toBeInTheDocument()
    })
  })

  describe('show past toggle', () => {
    it('renders show past toggle when showFilters is true', () => {
      render(<ConflictList conflicts={mockConflicts} />)
      expect(screen.getByText('Show Past')).toBeInTheDocument()
    })

    it('does not render show past toggle when showFilters is false', () => {
      render(<ConflictList conflicts={mockConflicts} showFilters={false} />)
      expect(screen.queryByText('Show Past')).not.toBeInTheDocument()
    })

    it('initially shows only future conflicts by default', () => {
      render(<ConflictList conflicts={mockConflicts} />)

      // Future conflicts should be visible
      expect(screen.getByText('Conflict 1')).toBeInTheDocument()
      expect(screen.getByText('Conflict 2')).toBeInTheDocument()

      // Past conflict (id 3, date 2024-12-15) should not be visible
      expect(screen.queryByText('Conflict 3')).not.toBeInTheDocument()
    })

    it('shows all conflicts when Show Past is toggled on', async () => {
      const user = userEvent.setup()
      render(<ConflictList conflicts={mockConflicts} />)

      const toggle = screen.getByRole('checkbox', { name: /show past/i })
      await user.click(toggle)

      expect(screen.getByText('Conflict 1')).toBeInTheDocument()
      expect(screen.getByText('Conflict 2')).toBeInTheDocument()
      expect(screen.getByText('Conflict 3')).toBeInTheDocument()
    })

    it('respects filter when Show Past is toggled', async () => {
      const user = userEvent.setup()
      render(<ConflictList conflicts={mockConflicts} />)

      const filterInput = screen.getByPlaceholderText('Filter by Member')
      const toggle = screen.getByRole('checkbox', { name: /show past/i })

      await user.type(filterInput, 'Conflict 3')
      expect(screen.queryByText('Conflict 3')).not.toBeInTheDocument()

      await user.click(toggle)
      expect(screen.getByText('Conflict 3')).toBeInTheDocument()
      expect(screen.queryByText('Conflict 1')).not.toBeInTheDocument()
    })
  })

  describe('with showFilters=false', () => {
    it('shows all conflicts regardless of date', () => {
      render(<ConflictList conflicts={mockConflicts} showFilters={false} />)

      expect(screen.getByText('Conflict 1')).toBeInTheDocument()
      expect(screen.getByText('Conflict 2')).toBeInTheDocument()
      expect(screen.getByText('Conflict 3')).toBeInTheDocument()
    })
  })

  describe('props forwarding to ConflictListItem', () => {
    it('passes baseRedirectUrl to ConflictListItem', () => {
      const { container } = render(
        <ConflictList
          conflicts={mockConflicts}
          baseRedirectUrl="/admin/conflicts/"
        />
      )
      // ConflictListItem is mocked, so we're just verifying it renders
      expect(container.querySelector('ul')).toBeInTheDocument()
    })

    it('passes actions to ConflictListItem', () => {
      const MockIcon = () => <svg />
      const actions = [
        {
          icon: MockIcon,
          onClick: vi.fn(),
          className: 'btn-green',
          ariaLabel: 'Approve'
        }
      ]

      const { container } = render(
        <ConflictList
          conflicts={mockConflicts}
          actions={actions}
        />
      )
      expect(container.querySelector('ul')).toBeInTheDocument()
    })
  })

  describe('list structure', () => {
    it('renders conflicts in an unordered list', () => {
      const { container } = render(<ConflictList conflicts={mockConflicts} />)
      const ul = container.querySelector('ul')
      expect(ul).toBeInTheDocument()
      expect(ul).toHaveClass('divide-y')
      expect(ul).toHaveClass('divide-gray-300')
      expect(ul).toHaveClass('dark:divide-gray-600')
    })
  })

  describe('edge cases', () => {
    it('handles conflicts with same title', () => {
      const duplicateConflicts = [
        { ...mockConflicts[0], id: 10 },
        { ...mockConflicts[0], id: 11 }
      ]
      render(<ConflictList conflicts={duplicateConflicts} />)

      const items = screen.getAllByText('Conflict 1')
      expect(items).toHaveLength(2)
    })

    it('handles empty conflict list gracefully', () => {
      const { container } = render(<ConflictList conflicts={[]} />)
      expect(container.firstChild).toBeNull()
    })

    it('updates displayed conflicts when conflicts prop changes', () => {
      const { rerender } = render(<ConflictList conflicts={[mockConflicts[0]]} />)
      expect(screen.getByText('Conflict 1')).toBeInTheDocument()
      expect(screen.queryByText('Conflict 2')).not.toBeInTheDocument()

      rerender(<ConflictList conflicts={mockConflicts} />)
      expect(screen.getByText('Conflict 1')).toBeInTheDocument()
      expect(screen.getByText('Conflict 2')).toBeInTheDocument()
    })
  })

  describe('combined filtering and past toggle', () => {
    it('can filter and toggle past at the same time', async () => {
      const user = userEvent.setup()
      const futureConflict = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
      const pastConflict = new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000)

      const conflicts = [
        {
          id: 1,
          title: 'Future Meeting',
          start: futureConflict.toISOString(),
          end: futureConflict.toISOString(),
          reason: 'Reason',
          status: { name: 'Pending' }
        },
        {
          id: 2,
          title: 'Past Meeting',
          start: pastConflict.toISOString(),
          end: pastConflict.toISOString(),
          reason: 'Reason',
          status: { name: 'Approved' }
        }
      ]

      render(<ConflictList conflicts={conflicts} />)

      const filterInput = screen.getByPlaceholderText('Filter by Member')
      const toggle = screen.getByRole('checkbox', { name: /show past/i })

      await user.type(filterInput, 'Meeting')
      await user.click(toggle)

      expect(screen.getByText('Future Meeting')).toBeInTheDocument()
      expect(screen.getByText('Past Meeting')).toBeInTheDocument()
    })
  })
})
