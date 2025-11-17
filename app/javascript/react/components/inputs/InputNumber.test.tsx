import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import userEvent from '@testing-library/user-event'
import { createRef } from 'react'
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

    it('formats value with 2 decimal places when currency is true', () => {
      render(<InputNumber name="amount" currency={true} value={10} />)
      expect(screen.getByRole('spinbutton')).toHaveValue(10)
    })

    it('displays currency value with fixed decimals', () => {
      const { container } = render(<InputNumber name="amount" currency={true} value={10.5} />)
      const input = container.querySelector('input')
      expect(input?.value).toBe('10.50')
    })
  })

  describe('min attribute', () => {
    it('does not set min by default', () => {
      render(<InputNumber name="amount" />)
      expect(screen.getByRole('spinbutton')).not.toHaveAttribute('min')
    })

    it('sets min attribute when provided', () => {
      render(<InputNumber name="amount" min={0} />)
      expect(screen.getByRole('spinbutton')).toHaveAttribute('min', '0')
    })

    it('respects min value', () => {
      render(<InputNumber name="amount" min={10} />)
      expect(screen.getByRole('spinbutton')).toHaveAttribute('min', '10')
    })
  })

  describe('step attribute', () => {
    it('does not set step by default', () => {
      render(<InputNumber name="amount" />)
      expect(screen.getByRole('spinbutton')).not.toHaveAttribute('step')
    })

    it('sets step attribute when provided', () => {
      render(<InputNumber name="amount" step={0.1} />)
      expect(screen.getByRole('spinbutton')).toHaveAttribute('step', '0.1')
    })

    it('accepts integer step values', () => {
      render(<InputNumber name="amount" step={5} />)
      expect(screen.getByRole('spinbutton')).toHaveAttribute('step', '5')
    })
  })

  describe('disabled state', () => {
    it('is enabled by default', () => {
      render(<InputNumber name="amount" />)
      expect(screen.getByRole('spinbutton')).not.toBeDisabled()
    })

    it('can be disabled', () => {
      render(<InputNumber name="amount" disabled={true} />)
      expect(screen.getByRole('spinbutton')).toBeDisabled()
    })
  })

  describe('autofocus', () => {
    it('does not autofocus by default', () => {
      render(<InputNumber name="amount" />)
      expect(document.activeElement).not.toBe(screen.getByRole('spinbutton'))
    })

    it('autofocuses when prop is true', () => {
      render(<InputNumber name="amount" autofocus={true} />)
      expect(document.activeElement).toBe(screen.getByRole('spinbutton'))
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

  describe('ref forwarding', () => {
    it('forwards ref to input element', () => {
      const ref = createRef<HTMLInputElement>()
      render(<InputNumber name="amount" ref={ref} />)

      expect(ref.current).toBeInstanceOf(HTMLInputElement)
      expect(ref.current?.tagName).toBe('INPUT')
    })

    it('allows programmatic focus via ref', () => {
      const ref = createRef<HTMLInputElement>()
      render(<InputNumber name="amount" ref={ref} />)

      ref.current?.focus()
      expect(document.activeElement).toBe(ref.current)
    })
  })

  describe('styling', () => {
    it('applies input-text class', () => {
      const { container } = render(<InputNumber name="amount" />)
      const input = container.querySelector('input')
      expect(input).toHaveClass('input-text')
    })

    it('applies correct styling to dollar sign', () => {
      const { container } = render(<InputNumber name="amount" currency={true} />)
      const dollarSign = container.querySelector('div')
      expect(dollarSign).toHaveClass('text-secondary')
      expect(dollarSign).toHaveClass('font-bold')
      expect(dollarSign).toHaveClass('mr-3')
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

    it('handles min and step together', () => {
      render(<InputNumber name="amount" min={0} step={0.5} />)
      const input = screen.getByRole('spinbutton')
      expect(input).toHaveAttribute('min', '0')
      expect(input).toHaveAttribute('step', '0.5')
    })
  })
})
