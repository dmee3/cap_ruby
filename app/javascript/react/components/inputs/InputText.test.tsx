import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import userEvent from '@testing-library/user-event'
import { createRef } from 'react'
import InputText from './InputText'

describe('InputText', () => {
  describe('rendering', () => {
    it('renders input with name attribute', () => {
      const { container } = render(<InputText name="testName" />)
      const input = container.querySelector('input[name="testName"]')
      expect(input).toBeInTheDocument()
    })

    it('renders with placeholder text', () => {
      render(<InputText name="test" placeholder="Enter text" />)
      expect(screen.getByPlaceholderText('Enter text')).toBeInTheDocument()
    })

    it('renders with id attribute', () => {
      render(<InputText name="test" id="customId" />)
      expect(screen.getByRole('textbox')).toHaveAttribute('id', 'customId')
    })

    it('renders with default value', () => {
      render(<InputText name="test" value="initial value" />)
      expect(screen.getByRole('textbox')).toHaveValue('initial value')
    })

    it('renders with empty string as default when no value provided', () => {
      render(<InputText name="test" />)
      expect(screen.getByRole('textbox')).toHaveValue('')
    })
  })

  describe('className', () => {
    it('applies default input-text class', () => {
      const { container } = render(<InputText name="test" />)
      const input = container.querySelector('input')
      expect(input).toHaveClass('input-text')
    })

    it('applies custom className along with default', () => {
      const { container } = render(<InputText name="test" className="custom-class" />)
      const input = container.querySelector('input')
      expect(input).toHaveClass('input-text')
      expect(input).toHaveClass('custom-class')
    })

    it('handles empty custom className', () => {
      const { container } = render(<InputText name="test" className="" />)
      const input = container.querySelector('input')
      expect(input).toHaveClass('input-text')
    })
  })

  describe('disabled state', () => {
    it('is enabled by default', () => {
      render(<InputText name="test" />)
      expect(screen.getByRole('textbox')).not.toBeDisabled()
    })

    it('can be disabled', () => {
      render(<InputText name="test" disabled={true} />)
      expect(screen.getByRole('textbox')).toBeDisabled()
    })

    it('prevents typing when disabled', async () => {
      const user = userEvent.setup()
      render(<InputText name="test" disabled={true} value="" />)
      const input = screen.getByRole('textbox')

      await user.type(input, 'test')
      expect(input).toHaveValue('')
    })
  })

  describe('autofocus', () => {
    it('does not autofocus by default', () => {
      render(<InputText name="test" />)
      expect(document.activeElement).not.toBe(screen.getByRole('textbox'))
    })

    it('autofocuses when prop is true', () => {
      render(<InputText name="test" autofocus={true} />)
      expect(document.activeElement).toBe(screen.getByRole('textbox'))
    })
  })

  describe('onChange handler', () => {
    it('calls onChange when user types', async () => {
      const user = userEvent.setup()
      const onChange = vi.fn()
      render(<InputText name="test" onChange={onChange} />)

      const input = screen.getByRole('textbox')
      await user.type(input, 'a')

      expect(onChange).toHaveBeenCalled()
    })

    it('receives change event with target value', async () => {
      const user = userEvent.setup()
      const onChange = vi.fn()
      render(<InputText name="test" onChange={onChange} />)

      const input = screen.getByRole('textbox')
      await user.type(input, 'test')

      expect(onChange).toHaveBeenCalledWith(expect.objectContaining({
        target: expect.objectContaining({
          value: expect.any(String)
        })
      }))
    })

    it('works without onChange handler', async () => {
      const user = userEvent.setup()
      render(<InputText name="test" />)

      const input = screen.getByRole('textbox')
      await expect(user.type(input, 'test')).resolves.not.toThrow()
    })
  })

  describe('ref forwarding', () => {
    it('forwards ref to input element', () => {
      const ref = createRef<HTMLInputElement>()
      render(<InputText name="test" ref={ref} />)

      expect(ref.current).toBeInstanceOf(HTMLInputElement)
      expect(ref.current?.tagName).toBe('INPUT')
    })

    it('allows programmatic focus via ref', () => {
      const ref = createRef<HTMLInputElement>()
      render(<InputText name="test" ref={ref} />)

      ref.current?.focus()
      expect(document.activeElement).toBe(ref.current)
    })
  })

  describe('type attribute', () => {
    it('has type="text"', () => {
      render(<InputText name="test" />)
      expect(screen.getByRole('textbox')).toHaveAttribute('type', 'text')
    })
  })
})
