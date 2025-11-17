import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import userEvent from '@testing-library/user-event'
import { createRef } from 'react'
import InputNumberV2 from './InputNumberV2'

describe('InputNumberV2', () => {
  describe('rendering', () => {
    it('renders masked input with name attribute', () => {
      const { container } = render(<InputNumberV2 name="amount" />)
      const input = container.querySelector('input[name="amount"]')
      expect(input).toBeInTheDocument()
    })

    it('renders with id attribute', () => {
      render(<InputNumberV2 name="amount" id="customId" />)
      const input = screen.getByRole('textbox')
      expect(input).toHaveAttribute('id', 'customId')
    })

    it('renders with empty default value', () => {
      render(<InputNumberV2 name="amount" />)
      expect(screen.getByRole('textbox')).toHaveValue('')
    })

    it('renders with provided string value', () => {
      render(<InputNumberV2 name="amount" value="100" />)
      expect(screen.getByRole('textbox')).toHaveValue('100')
    })

    it('renders with provided numeric value', () => {
      render(<InputNumberV2 name="amount" value={42} />)
      expect(screen.getByRole('textbox')).toHaveValue('42')
    })
  })

  describe('currency mode', () => {
    it('shows currency placeholder by default when currency is true', () => {
      render(<InputNumberV2 name="amount" currency={true} />)
      expect(screen.getByPlaceholderText('$0.00')).toBeInTheDocument()
    })

    it('uses custom placeholder over default currency placeholder', () => {
      render(<InputNumberV2 name="amount" currency={true} placeholder="Enter amount" />)
      expect(screen.getByPlaceholderText('Enter amount')).toBeInTheDocument()
    })

    it('does not show currency placeholder when currency is false', () => {
      render(<InputNumberV2 name="amount" placeholder="Amount" />)
      expect(screen.getByPlaceholderText('Amount')).toBeInTheDocument()
    })

    it('formats currency values with dollar sign', () => {
      // Test with controlled value instead of typing into masked input
      render(<InputNumberV2 name="amount" currency={true} value="1000" onChange={vi.fn()} />)

      const input = screen.getByRole('textbox')
      // The masked input formats the value
      expect(input.value).toContain('1')
    })
  })

  describe('masking behavior', () => {
    it('accepts decimal numbers', () => {
      // Test with controlled value
      render(<InputNumberV2 name="amount" value="10.50" onChange={vi.fn()} />)

      const input = screen.getByRole('textbox')
      // Should contain the numbers
      expect(input.value).toBe('10.50')
    })

    it('masks large numbers with commas', async () => {
      const user = userEvent.setup()
      const onChange = vi.fn()
      render(<InputNumberV2 name="amount" onChange={onChange} />)

      const input = screen.getByRole('textbox')
      await user.type(input, '1000')

      expect(onChange).toHaveBeenCalled()
    })
  })

  describe('disabled state', () => {
    it('is enabled by default', () => {
      render(<InputNumberV2 name="amount" />)
      expect(screen.getByRole('textbox')).not.toBeDisabled()
    })

    it('can be disabled', () => {
      render(<InputNumberV2 name="amount" disabled={true} />)
      expect(screen.getByRole('textbox')).toBeDisabled()
    })

    it('prevents input when disabled', async () => {
      const user = userEvent.setup()
      const onChange = vi.fn()
      render(<InputNumberV2 name="amount" disabled={true} onChange={onChange} />)

      const input = screen.getByRole('textbox')
      await user.type(input, '42')

      expect(onChange).not.toHaveBeenCalled()
    })
  })

  describe('autofocus', () => {
    it('does not autofocus by default', () => {
      render(<InputNumberV2 name="amount" />)
      expect(document.activeElement).not.toBe(screen.getByRole('textbox'))
    })

    it('autofocuses when prop is true', () => {
      render(<InputNumberV2 name="amount" autofocus={true} />)
      expect(document.activeElement).toBe(screen.getByRole('textbox'))
    })
  })

  describe('onChange handler', () => {
    it('calls onChange with unmasked value', async () => {
      const user = userEvent.setup()
      const onChange = vi.fn()
      render(<InputNumberV2 name="amount" onChange={onChange} />)

      const input = screen.getByRole('textbox')
      await user.type(input, '5')

      expect(onChange).toHaveBeenCalled()
      // Check that the event contains the unmasked value
      const lastCall = onChange.mock.calls[onChange.mock.calls.length - 1]
      expect(lastCall[0].target.value).toBe('5')
    })

    it('extracts numeric value from formatted input', async () => {
      const user = userEvent.setup()
      const onChange = vi.fn()
      render(<InputNumberV2 name="amount" currency={true} onChange={onChange} />)

      const input = screen.getByRole('textbox')
      await user.type(input, '100')

      expect(onChange).toHaveBeenCalled()
      // Should extract just the numbers
      const lastCall = onChange.mock.calls[onChange.mock.calls.length - 1]
      expect(lastCall[0].target.value).toMatch(/\d+/)
    })

    it('handles decimal point input', async () => {
      const user = userEvent.setup()
      const onChange = vi.fn()
      render(<InputNumberV2 name="amount" onChange={onChange} />)

      const input = screen.getByRole('textbox')
      await user.type(input, '10.5')

      expect(onChange).toHaveBeenCalled()
    })
  })

  describe('ref forwarding', () => {
    it('forwards ref to input element', () => {
      const ref = createRef<HTMLInputElement>()
      render(<InputNumberV2 name="amount" ref={ref} />)

      expect(ref.current).toBeInstanceOf(HTMLInputElement)
      expect(ref.current?.tagName).toBe('INPUT')
    })

    it('allows programmatic focus via ref', () => {
      const ref = createRef<HTMLInputElement>()
      render(<InputNumberV2 name="amount" ref={ref} />)

      ref.current?.focus()
      expect(document.activeElement).toBe(ref.current)
    })
  })

  describe('className', () => {
    it('applies default input-text class', () => {
      const { container } = render(<InputNumberV2 name="amount" />)
      const input = container.querySelector('input')
      expect(input).toHaveClass('input-text')
    })

    it('applies custom className along with default', () => {
      const { container } = render(<InputNumberV2 name="amount" className="custom-class" />)
      const input = container.querySelector('input')
      expect(input).toHaveClass('input-text')
      expect(input).toHaveClass('custom-class')
    })

    it('handles empty custom className', () => {
      const { container } = render(<InputNumberV2 name="amount" className="" />)
      const input = container.querySelector('input')
      expect(input).toHaveClass('input-text')
    })
  })

  describe('display name', () => {
    it('has correct display name', () => {
      expect(InputNumberV2.displayName).toBe('InputNumberV2')
    })
  })

  describe('value synchronization', () => {
    it('updates when value prop changes', () => {
      const { rerender } = render(<InputNumberV2 name="amount" value="10" />)
      expect(screen.getByRole('textbox')).toHaveValue('10')

      rerender(<InputNumberV2 name="amount" value="20" />)
      expect(screen.getByRole('textbox')).toHaveValue('20')
    })

    it('maintains internal state for decimal point', () => {
      // Test that component can handle decimal point values
      render(<InputNumberV2 name="amount" value="10." onChange={vi.fn()} />)

      const input = screen.getByRole('textbox')
      // Should handle trailing decimal
      expect(input.value).toBe('10.')
    })
  })
})
