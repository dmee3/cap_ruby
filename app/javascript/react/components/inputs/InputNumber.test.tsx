import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import userEvent from '@testing-library/user-event'
import InputNumber from './InputNumber'
import React from 'react'

describe('InputNumber', () => {
  describe('rendering', () => {
    it('renders input with name attribute', () => {
      const { container } = render(
        <InputNumber
          name="amount"
          placeholder="Enter amount"
          id="customId"
          value={42}
        />
      )
      const input = container.querySelector('input[name="amount"]')
      expect(input).toBeInTheDocument()
      expect(screen.getByPlaceholderText('Enter amount')).toBeInTheDocument()
      expect(screen.getByRole('spinbutton')).toHaveAttribute('id', 'customId')
      expect(screen.getByRole('spinbutton')).toHaveValue(42)
    })

    it('renders with default value of 0', () => {
      render(<InputNumber name="amount" />)
      expect(screen.getByRole('spinbutton')).toHaveValue(0)
    })
  })

  describe('type attribute', () => {
    it('has type="number" by default', () => {
      render(<InputNumber name="amount" />)
      expect(screen.getByRole('spinbutton')).toHaveAttribute('type', 'number')
    })

    it('has type="text" when masked is true', () => {
      render(<InputNumber name="amount" masked={true} />)
      const input = screen.getByRole('textbox')
      expect(input).toHaveAttribute('type', 'text')
    })
  })

  describe('currency mode', () => {
    it('does not show dollar sign by default', () => {
      const { container } = render(<InputNumber name="amount" />)
      expect(container.textContent).not.toContain('$')
    })

    it('shows dollar sign when currency is true', () => {
      const { container } = render(<InputNumber name="amount" currency={true} />)
      expect(container.textContent).toContain('$')
    })

    it('displays currency value with fixed decimals', () => {
      const { container } = render(<InputNumber name="amount" currency={true} value={10.5} />)
      const input = container.querySelector('input')
      expect(input?.value).toBe('10.50')
    })
  })

  describe('onChange handler', () => {
    it('calls onChange when value changes', async () => {
      const user = userEvent.setup()
      const onChange = vi.fn()
      render(<InputNumber name="amount" onChange={onChange} />)

      const input = screen.getByRole('spinbutton')
      await user.clear(input)
      await user.type(input, '42')

      expect(onChange).toHaveBeenCalled()
    })

    it('works without onChange handler', async () => {
      const user = userEvent.setup()
      render(<InputNumber name="amount" />)

      const input = screen.getByRole('spinbutton')
      await expect(user.type(input, '5')).resolves.not.toThrow()
    })
  })

  // The component picks value vs defaultValue off the presence of onChange.
  // Getting this backwards makes the field either frozen or uncontrolled, and
  // React only warns at runtime.
  describe('controlled vs uncontrolled', () => {
    it('is controlled when an onChange handler is given', () => {
      const onChange = vi.fn()
      render(<InputNumber name="amount" value={7} onChange={onChange} />)
      expect(screen.getByRole('spinbutton')).toHaveValue(7)
    })

    it('leaves the field editable when no onChange is given', async () => {
      const user = userEvent.setup()
      render(<InputNumber name="amount" value={7} />)

      const input = screen.getByRole('spinbutton')
      await user.clear(input)
      await user.type(input, '9')

      expect(input).toHaveValue(9)
    })
  })

  describe('combined props', () => {
    it('handles currency with masked type', () => {
      const { container } = render(<InputNumber name="amount" currency={true} masked={true} value={25.5} />)
      expect(container.textContent).toContain('$')
      const input = screen.getByRole('textbox') as HTMLInputElement
      expect(input).toHaveAttribute('type', 'text')
      expect(input.value).toBe('25.50')
    })
  })
})
