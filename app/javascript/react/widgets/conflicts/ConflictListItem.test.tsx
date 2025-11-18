import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import userEvent from '@testing-library/user-event'
import ConflictListItem from './ConflictListItem'

// Mock the Utilities module
vi.mock('../../../utilities/utilities', () => ({
  default: {
    displayDateTimeReadable: (date: string) => `Formatted: ${date}`,
    statusToColor: (status: string) => {
      const colorMap = {
        'Pending': 'yellow',
        'Approved': 'green',
        'Denied': 'red',
        'Resolved': 'gray'
      }
      return colorMap[status] || 'gray'
    }
  }
}))

describe('ConflictListItem', () => {
  const mockConflict = {
    id: 1,
    title: 'Test Conflict',
    start: '2025-01-15T10:00:00Z',
    end: '2025-01-15T14:00:00Z',
    reason: 'Doctor appointment',
    status: {
      name: 'Pending'
    }
  }

  beforeEach(() => {
    // Clear any window.location assignments
    delete (window as any).location
    window.location = { href: '' } as any
  })

  describe('rendering', () => {
    it('renders conflict details', () => {
      render(<ConflictListItem conflict={mockConflict} />)

      expect(screen.getByText('Test Conflict')).toBeInTheDocument()
      expect(screen.getByText(/Formatted: 2025-01-15T10:00:00Z/)).toBeInTheDocument()
      expect(screen.getByText(/Formatted: 2025-01-15T14:00:00Z/)).toBeInTheDocument()
      expect(screen.getByText('Doctor appointment')).toBeInTheDocument()
      expect(screen.getByText('Pending')).toBeInTheDocument()
    })

    it('renders badge with correct status', () => {
      render(<ConflictListItem conflict={mockConflict} />)
      expect(screen.getByText('Pending')).toBeInTheDocument()
    })

    it('renders conflict with different status', () => {
      const approvedConflict = {
        ...mockConflict,
        status: { name: 'Approved' }
      }
      render(<ConflictListItem conflict={approvedConflict} />)
      expect(screen.getByText('Approved')).toBeInTheDocument()
    })
  })

  describe('clickable behavior', () => {
    it('applies cursor-pointer class when baseRedirectUrl is provided', () => {
      const { container } = render(
        <ConflictListItem
          conflict={mockConflict}
          baseRedirectUrl="/admin/conflicts/"
        />
      )
      const listItem = container.querySelector('li')
      expect(listItem).toHaveClass('cursor-pointer')
    })

    it('applies table-row-hover class when baseRedirectUrl is provided', () => {
      const { container } = render(
        <ConflictListItem
          conflict={mockConflict}
          baseRedirectUrl="/admin/conflicts/"
        />
      )
      const listItem = container.querySelector('li')
      expect(listItem).toHaveClass('table-row-hover')
    })

    it('does not apply cursor-pointer when baseRedirectUrl is not provided', () => {
      const { container } = render(
        <ConflictListItem conflict={mockConflict} />
      )
      const listItem = container.querySelector('li')
      expect(listItem).not.toHaveClass('cursor-pointer')
    })

    it('navigates to edit page when clicked with baseRedirectUrl', async () => {
      const user = userEvent.setup()
      const { container } = render(
        <ConflictListItem
          conflict={mockConflict}
          baseRedirectUrl="/admin/conflicts/"
        />
      )

      const listItem = container.querySelector('li')
      await user.click(listItem!)

      expect(window.location.href).toBe('/admin/conflicts/1/edit')
    })

    it('does not navigate when clicked without baseRedirectUrl', async () => {
      const user = userEvent.setup()
      const { container } = render(
        <ConflictListItem conflict={mockConflict} />
      )

      const listItem = container.querySelector('li')
      await user.click(listItem!)

      expect(window.location.href).toBe('')
    })
  })

  describe('layout without actions', () => {
    it('uses flex-row layout when no actions provided', () => {
      const { container } = render(
        <ConflictListItem conflict={mockConflict} />
      )
      const listItem = container.querySelector('li')
      expect(listItem).toHaveClass('flex-row')
    })

    it('applies standard padding when no actions', () => {
      const { container } = render(
        <ConflictListItem conflict={mockConflict} />
      )
      const contentDiv = container.querySelector('div.p-4')
      expect(contentDiv).toBeInTheDocument()
      expect(contentDiv).not.toHaveClass('pb-2')
    })
  })

  describe('with actions', () => {
    const mockApprove = vi.fn()
    const mockDeny = vi.fn()
    const MockIcon = () => <svg data-testid="mock-icon" />

    const actions = [
      {
        icon: MockIcon,
        onClick: mockApprove,
        className: 'btn-green btn-md',
        ariaLabel: 'Approve conflict'
      },
      {
        icon: MockIcon,
        onClick: mockDeny,
        className: 'btn-red btn-md',
        ariaLabel: 'Deny conflict'
      }
    ]

    beforeEach(() => {
      mockApprove.mockClear()
      mockDeny.mockClear()
    })

    it('renders action buttons', () => {
      render(
        <ConflictListItem
          conflict={mockConflict}
          actions={actions}
        />
      )

      expect(screen.getByLabelText('Approve conflict')).toBeInTheDocument()
      expect(screen.getByLabelText('Deny conflict')).toBeInTheDocument()
    })

    it('uses flex-col layout when actions are provided', () => {
      const { container } = render(
        <ConflictListItem
          conflict={mockConflict}
          actions={actions}
        />
      )
      const listItem = container.querySelector('li')
      expect(listItem).toHaveClass('flex-col')
    })

    it('applies reduced bottom padding to content when actions present', () => {
      const { container } = render(
        <ConflictListItem
          conflict={mockConflict}
          actions={actions}
        />
      )
      const contentDiv = container.querySelector('div.p-4')
      expect(contentDiv).toHaveClass('pb-2')
    })

    it('calls action onClick with conflict id when button clicked', async () => {
      const user = userEvent.setup()
      render(
        <ConflictListItem
          conflict={mockConflict}
          actions={actions}
        />
      )

      await user.click(screen.getByLabelText('Approve conflict'))
      expect(mockApprove).toHaveBeenCalledWith(1)
      expect(mockApprove).toHaveBeenCalledTimes(1)
    })

    it('calls correct action for each button', async () => {
      const user = userEvent.setup()
      render(
        <ConflictListItem
          conflict={mockConflict}
          actions={actions}
        />
      )

      await user.click(screen.getByLabelText('Deny conflict'))
      expect(mockDeny).toHaveBeenCalledWith(1)
      expect(mockApprove).not.toHaveBeenCalled()
    })

    it('applies correct className to action buttons', () => {
      render(
        <ConflictListItem
          conflict={mockConflict}
          actions={actions}
        />
      )

      const approveButton = screen.getByLabelText('Approve conflict')
      const denyButton = screen.getByLabelText('Deny conflict')

      expect(approveButton).toHaveClass('btn-green', 'btn-md')
      expect(denyButton).toHaveClass('btn-red', 'btn-md')
    })

    it('prevents navigation when action button clicked', async () => {
      const user = userEvent.setup()
      render(
        <ConflictListItem
          conflict={mockConflict}
          baseRedirectUrl="/admin/conflicts/"
          actions={actions}
        />
      )

      await user.click(screen.getByLabelText('Approve conflict'))

      expect(mockApprove).toHaveBeenCalled()
      expect(window.location.href).toBe('')
    })

    it('still allows navigation when clicking conflict details with actions', async () => {
      const user = userEvent.setup()
      const { container } = render(
        <ConflictListItem
          conflict={mockConflict}
          baseRedirectUrl="/admin/conflicts/"
          actions={actions}
        />
      )

      const listItem = container.querySelector('li')
      await user.click(listItem!)

      expect(window.location.href).toBe('/admin/conflicts/1/edit')
    })
  })

  describe('accessibility', () => {
    const MockIcon = () => <svg />
    const actions = [
      {
        icon: MockIcon,
        onClick: vi.fn(),
        className: 'btn-green',
        ariaLabel: 'Approve this conflict'
      }
    ]

    it('action buttons have proper aria-label', () => {
      render(
        <ConflictListItem
          conflict={mockConflict}
          actions={actions}
        />
      )

      expect(screen.getByLabelText('Approve this conflict')).toBeInTheDocument()
    })

    it('renders semantic list item', () => {
      const { container } = render(
        <ConflictListItem conflict={mockConflict} />
      )
      expect(container.querySelector('li')).toBeInTheDocument()
    })
  })
})
