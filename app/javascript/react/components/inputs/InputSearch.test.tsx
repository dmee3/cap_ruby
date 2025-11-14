import { render, screen, within } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import userEvent from '@testing-library/user-event'
import { createRef } from 'react'
import InputSearch from './InputSearch'

describe('InputSearch', () => {
  const defaultOptions = ['Apple', 'Banana', 'Cherry', 'Date', 'Elderberry', 'Raspberry', 'Strawberry']

  describe('rendering', () => {
    it('renders input with name attribute', () => {
      const { container } = render(
        <InputSearch name="search" onChange={vi.fn()} options={defaultOptions} />
      )
      const input = container.querySelector('input[name="search"]')
      expect(input).toBeInTheDocument()
    })

    it('renders with placeholder', () => {
      render(
        <InputSearch
          name="search"
          onChange={vi.fn()}
          options={defaultOptions}
          placeholder="Search..."
        />
      )
      expect(screen.getByPlaceholderText('Search...')).toBeInTheDocument()
    })

    it('renders with id attribute', () => {
      render(
        <InputSearch
          name="search"
          onChange={vi.fn()}
          options={defaultOptions}
          id="customId"
        />
      )
      expect(screen.getByRole('textbox')).toHaveAttribute('id', 'customId')
    })

    it('renders with empty default value', () => {
      render(<InputSearch name="search" onChange={vi.fn()} options={defaultOptions} />)
      expect(screen.getByRole('textbox')).toHaveValue('')
    })

    it('renders with initial value', () => {
      render(
        <InputSearch
          name="search"
          onChange={vi.fn()}
          options={defaultOptions}
          value="Apple"
        />
      )
      expect(screen.getByRole('textbox')).toHaveValue('Apple')
    })
  })

  describe('disabled state', () => {
    it('is enabled by default', () => {
      render(<InputSearch name="search" onChange={vi.fn()} options={defaultOptions} />)
      expect(screen.getByRole('textbox')).not.toBeDisabled()
    })

    it('can be disabled', () => {
      render(
        <InputSearch
          name="search"
          onChange={vi.fn()}
          options={defaultOptions}
          disabled={true}
        />
      )
      expect(screen.getByRole('textbox')).toBeDisabled()
    })
  })

  describe('autofocus', () => {
    it('does not autofocus by default', () => {
      render(<InputSearch name="search" onChange={vi.fn()} options={defaultOptions} />)
      expect(document.activeElement).not.toBe(screen.getByRole('textbox'))
    })

    it('autofocuses when prop is true', () => {
      render(
        <InputSearch
          name="search"
          onChange={vi.fn()}
          options={defaultOptions}
          autofocus={true}
        />
      )
      expect(document.activeElement).toBe(screen.getByRole('textbox'))
    })
  })

  describe('fuzzy search functionality', () => {
    it('does not show suggestions initially', () => {
      render(<InputSearch name="search" onChange={vi.fn()} options={defaultOptions} />)
      expect(screen.queryByRole('list')).not.toBeInTheDocument()
    })

    it('does not show suggestions for single character', async () => {
      const user = userEvent.setup()
      render(<InputSearch name="search" onChange={vi.fn()} options={defaultOptions} />)

      const input = screen.getByRole('textbox')
      await user.type(input, 'a')

      expect(screen.queryByRole('list')).not.toBeInTheDocument()
    })

    it('shows suggestions after typing 2+ characters', async () => {
      const user = userEvent.setup()
      render(<InputSearch name="search" onChange={vi.fn()} options={defaultOptions} />)

      const input = screen.getByRole('textbox')
      await user.type(input, 'ap')

      expect(screen.getByRole('list')).toBeInTheDocument()
    })

    it('filters options based on fuzzy search', async () => {
      const user = userEvent.setup()
      render(<InputSearch name="search" onChange={vi.fn()} options={defaultOptions} />)

      const input = screen.getByRole('textbox')
      await user.type(input, 'app')

      const list = screen.getByRole('list')
      expect(within(list).getByText('Apple')).toBeInTheDocument()
    })

    it('handles case-insensitive search', async () => {
      const user = userEvent.setup()
      render(<InputSearch name="search" onChange={vi.fn()} options={defaultOptions} />)

      const input = screen.getByRole('textbox')
      await user.type(input, 'APP')

      const list = screen.getByRole('list')
      expect(within(list).getByText('Apple')).toBeInTheDocument()
    })

    it('finds partial matches', async () => {
      const user = userEvent.setup()
      render(<InputSearch name="search" onChange={vi.fn()} options={defaultOptions} />)

      const input = screen.getByRole('textbox')
      await user.type(input, 'ban')

      const list = screen.getByRole('list')
      expect(within(list).getByText('Banana')).toBeInTheDocument()
    })
  })

  describe('selecting suggestions', () => {
    it('calls onChange when suggestion is clicked', async () => {
      const user = userEvent.setup()
      const onChange = vi.fn()
      render(<InputSearch name="search" onChange={onChange} options={defaultOptions} />)

      const input = screen.getByRole('textbox')
      await user.type(input, 'ap')

      const suggestion = screen.getByText('Apple')
      await user.click(suggestion)

      expect(onChange).toHaveBeenCalledWith('Apple')
    })

    it('updates input value when suggestion is clicked', async () => {
      const user = userEvent.setup()
      render(<InputSearch name="search" onChange={vi.fn()} options={defaultOptions} />)

      const input = screen.getByRole('textbox')
      await user.type(input, 'ap')

      const suggestion = screen.getByText('Apple')
      await user.click(suggestion)

      expect(input).toHaveValue('Apple')
    })

    it('hides suggestions after selection', async () => {
      const user = userEvent.setup()
      render(<InputSearch name="search" onChange={vi.fn()} options={defaultOptions} />)

      const input = screen.getByRole('textbox')
      await user.type(input, 'ap')

      const suggestion = screen.getByText('Apple')
      await user.click(suggestion)

      expect(screen.queryByRole('list')).not.toBeInTheDocument()
    })
  })

  describe('keyboard navigation', () => {
    it('navigates down with arrow key', async () => {
      const user = userEvent.setup()
      render(<InputSearch name="search" onChange={vi.fn()} options={defaultOptions} />)

      const input = screen.getByRole('textbox')
      await user.type(input, 'err') // Type 3 characters to trigger suggestions

      await user.keyboard('{ArrowDown}')

      // Should highlight next option (visual change, tested via class)
      const list = screen.getByRole('list')
      const items = within(list).getAllByRole('listitem')
      expect(items[1]).toHaveClass('active')
    })

    it('navigates up with arrow key', async () => {
      const user = userEvent.setup()
      render(<InputSearch name="search" onChange={vi.fn()} options={defaultOptions} />)

      const input = screen.getByRole('textbox')
      await user.type(input, 'err') // Type 3 characters to trigger suggestions

      // Go down then up
      await user.keyboard('{ArrowDown}')
      await user.keyboard('{ArrowDown}')
      await user.keyboard('{ArrowUp}')

      const list = screen.getByRole('list')
      const items = within(list).getAllByRole('listitem')
      expect(items[1]).toHaveClass('active')
    })

    it('does not go below first option', async () => {
      const user = userEvent.setup()
      render(<InputSearch name="search" onChange={vi.fn()} options={defaultOptions} />)

      const input = screen.getByRole('textbox')
      await user.type(input, 'err') // Type 3 characters to trigger suggestions

      // Try to go up from first position
      await user.keyboard('{ArrowUp}')

      const list = screen.getByRole('list')
      const items = within(list).getAllByRole('listitem')
      expect(items[0]).toHaveClass('active')
    })

    it('selects option with Enter key', async () => {
      const user = userEvent.setup()
      const onChange = vi.fn()
      render(<InputSearch name="search" onChange={onChange} options={defaultOptions} />)

      const input = screen.getByRole('textbox')
      await user.type(input, 'ap')

      await user.keyboard('{Enter}')

      expect(onChange).toHaveBeenCalled()
    })

    it('closes suggestions after Enter selection', async () => {
      const user = userEvent.setup()
      render(<InputSearch name="search" onChange={vi.fn()} options={defaultOptions} />)

      const input = screen.getByRole('textbox')
      await user.type(input, 'ap')

      await user.keyboard('{Enter}')

      expect(screen.queryByRole('list')).not.toBeInTheDocument()
    })
  })

  describe('value updates', () => {
    it('updates when value prop changes', () => {
      const { rerender } = render(
        <InputSearch
          name="search"
          onChange={vi.fn()}
          options={defaultOptions}
          value="Apple"
        />
      )
      expect(screen.getByRole('textbox')).toHaveValue('Apple')

      rerender(
        <InputSearch
          name="search"
          onChange={vi.fn()}
          options={defaultOptions}
          value="Banana"
        />
      )
      expect(screen.getByRole('textbox')).toHaveValue('Banana')
    })
  })

  describe('ref forwarding', () => {
    it('forwards ref to input element', () => {
      const ref = createRef<HTMLInputElement>()
      render(
        <InputSearch
          name="search"
          onChange={vi.fn()}
          options={defaultOptions}
          ref={ref}
        />
      )

      expect(ref.current).toBeInstanceOf(HTMLInputElement)
      expect(ref.current?.tagName).toBe('INPUT')
    })

    it('allows programmatic focus via ref', () => {
      const ref = createRef<HTMLInputElement>()
      render(
        <InputSearch
          name="search"
          onChange={vi.fn()}
          options={defaultOptions}
          ref={ref}
        />
      )

      ref.current?.focus()
      expect(document.activeElement).toBe(ref.current)
    })
  })

  describe('styling', () => {
    it('applies input-search class', () => {
      const { container } = render(
        <InputSearch name="search" onChange={vi.fn()} options={defaultOptions} />
      )
      const input = container.querySelector('input')
      expect(input).toHaveClass('input-search')
    })

    it('applies correct classes to suggestions container', async () => {
      const user = userEvent.setup()
      const { container } = render(
        <InputSearch name="search" onChange={vi.fn()} options={defaultOptions} />
      )

      const input = screen.getByRole('textbox')
      await user.type(input, 'ap')

      const list = container.querySelector('ul')
      expect(list).toHaveClass('input-search-suggestions-container')
    })

    it('applies active class to highlighted suggestion', async () => {
      const user = userEvent.setup()
      render(<InputSearch name="search" onChange={vi.fn()} options={defaultOptions} />)

      const input = screen.getByRole('textbox')
      await user.type(input, 'err') // Type 3 characters to trigger suggestions

      const list = screen.getByRole('list')
      const items = within(list).getAllByRole('listitem')
      expect(items[0]).toHaveClass('active')
    })
  })
})
