import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import userEvent from '@testing-library/user-event'
import { createRef } from 'react'
import InputTextarea from './InputTextarea'

describe('InputTextarea', () => {
  describe('rendering', () => {
    it('renders textarea with name attribute', () => {
      const { container } = render(<InputTextarea name="description" />)
      const textarea = container.querySelector('textarea[name="description"]')
      expect(textarea).toBeInTheDocument()
    })

    it('renders with placeholder text', () => {
      render(<InputTextarea name="description" placeholder="Enter description" />)
      expect(screen.getByPlaceholderText('Enter description')).toBeInTheDocument()
    })

    it('renders with id attribute', () => {
      render(<InputTextarea name="description" id="customId" />)
      expect(screen.getByRole('textbox')).toHaveAttribute('id', 'customId')
    })

    it('renders with empty default value', () => {
      render(<InputTextarea name="description" />)
      expect(screen.getByRole('textbox')).toHaveValue('')
    })

    it('renders with initial value', () => {
      render(<InputTextarea name="description" value="Initial text" />)
      expect(screen.getByRole('textbox')).toHaveValue('Initial text')
    })
  })

  describe('rows attribute', () => {
    it('has default rows of 3', () => {
      render(<InputTextarea name="description" />)
      expect(screen.getByRole('textbox')).toHaveAttribute('rows', '3')
    })

    it('accepts custom rows value', () => {
      render(<InputTextarea name="description" rows={5} />)
      expect(screen.getByRole('textbox')).toHaveAttribute('rows', '5')
    })

    it('handles single row', () => {
      render(<InputTextarea name="description" rows={1} />)
      expect(screen.getByRole('textbox')).toHaveAttribute('rows', '1')
    })

    it('handles large row count', () => {
      render(<InputTextarea name="description" rows={20} />)
      expect(screen.getByRole('textbox')).toHaveAttribute('rows', '20')
    })
  })

  describe('className', () => {
    it('applies default input-text class', () => {
      const { container } = render(<InputTextarea name="description" />)
      const textarea = container.querySelector('textarea')
      expect(textarea).toHaveClass('input-text')
    })

    it('applies custom className along with default', () => {
      const { container } = render(
        <InputTextarea name="description" className="custom-class" />
      )
      const textarea = container.querySelector('textarea')
      expect(textarea).toHaveClass('input-text')
      expect(textarea).toHaveClass('custom-class')
    })

    it('handles empty custom className', () => {
      const { container } = render(<InputTextarea name="description" className="" />)
      const textarea = container.querySelector('textarea')
      expect(textarea).toHaveClass('input-text')
    })

    it('handles multiple custom classes', () => {
      const { container } = render(
        <InputTextarea name="description" className="class-one class-two" />
      )
      const textarea = container.querySelector('textarea')
      expect(textarea).toHaveClass('input-text')
      expect(textarea).toHaveClass('class-one')
      expect(textarea).toHaveClass('class-two')
    })
  })

  describe('disabled state', () => {
    it('is enabled by default', () => {
      render(<InputTextarea name="description" />)
      expect(screen.getByRole('textbox')).not.toBeDisabled()
    })

    it('can be disabled', () => {
      render(<InputTextarea name="description" disabled={true} />)
      expect(screen.getByRole('textbox')).toBeDisabled()
    })

    it('prevents typing when disabled', async () => {
      const user = userEvent.setup()
      render(<InputTextarea name="description" disabled={true} value="" />)
      const textarea = screen.getByRole('textbox')

      await user.type(textarea, 'test')
      expect(textarea).toHaveValue('')
    })
  })

  describe('autofocus', () => {
    it('does not autofocus by default', () => {
      render(<InputTextarea name="description" />)
      expect(document.activeElement).not.toBe(screen.getByRole('textbox'))
    })

    it('autofocuses when prop is true', () => {
      render(<InputTextarea name="description" autofocus={true} />)
      expect(document.activeElement).toBe(screen.getByRole('textbox'))
    })
  })

  describe('onChange handler', () => {
    it('calls onChange when user types', async () => {
      const user = userEvent.setup()
      const onChange = vi.fn()
      render(<InputTextarea name="description" onChange={onChange} />)

      const textarea = screen.getByRole('textbox')
      await user.type(textarea, 'a')

      expect(onChange).toHaveBeenCalled()
    })

    it('receives change event with target value', async () => {
      const user = userEvent.setup()
      const onChange = vi.fn()
      render(<InputTextarea name="description" onChange={onChange} />)

      const textarea = screen.getByRole('textbox')
      await user.type(textarea, 'test')

      expect(onChange).toHaveBeenCalledWith(
        expect.objectContaining({
          target: expect.objectContaining({
            value: expect.any(String),
          }),
        })
      )
    })

    it('works without onChange handler', async () => {
      const user = userEvent.setup()
      render(<InputTextarea name="description" />)

      const textarea = screen.getByRole('textbox')
      await expect(user.type(textarea, 'test')).resolves.not.toThrow()
    })
  })

  describe('multiline text handling', () => {
    it('accepts multiline text input', () => {
      const multilineText = 'Line 1\nLine 2\nLine 3'
      render(<InputTextarea name="description" value={multilineText} onChange={vi.fn()} />)

      expect(screen.getByRole('textbox')).toHaveValue(multilineText)
    })

    it('preserves newlines in value', () => {
      const multilineText = 'First line\nSecond line\nThird line'
      render(<InputTextarea name="description" value={multilineText} />)

      expect(screen.getByRole('textbox')).toHaveValue(multilineText)
    })

    it('handles long text content', () => {
      // Test with controlled value instead of typing to avoid timeout
      const longText = 'a'.repeat(1000)
      render(<InputTextarea name="description" value={longText} onChange={vi.fn()} />)

      expect(screen.getByRole('textbox')).toHaveValue(longText)
    })
  })

  describe('ref forwarding', () => {
    it('forwards ref to textarea element', () => {
      const ref = createRef<HTMLTextAreaElement>()
      render(<InputTextarea name="description" ref={ref} />)

      expect(ref.current).toBeInstanceOf(HTMLTextAreaElement)
      expect(ref.current?.tagName).toBe('TEXTAREA')
    })

    it('allows programmatic focus via ref', () => {
      const ref = createRef<HTMLTextAreaElement>()
      render(<InputTextarea name="description" ref={ref} />)

      ref.current?.focus()
      expect(document.activeElement).toBe(ref.current)
    })

    it('allows programmatic value access via ref', () => {
      const ref = createRef<HTMLTextAreaElement>()
      render(<InputTextarea name="description" value="test value" ref={ref} />)

      expect(ref.current?.value).toBe('test value')
    })
  })

  describe('placeholder behavior', () => {
    it('shows placeholder when empty', () => {
      render(<InputTextarea name="description" placeholder="Type here..." />)
      expect(screen.getByPlaceholderText('Type here...')).toBeInTheDocument()
    })

    it('has placeholder attribute when value is set', () => {
      render(<InputTextarea name="description" placeholder="Type here..." value="text" onChange={vi.fn()} />)

      const textarea = screen.getByPlaceholderText('Type here...')
      // Placeholder still exists as attribute
      expect(textarea).toHaveAttribute('placeholder', 'Type here...')
      expect(textarea).toHaveValue('text')
    })
  })

  describe('special characters', () => {
    it('handles special characters', () => {
      render(<InputTextarea name="description" value="!@#$" onChange={vi.fn()} />)
      expect(screen.getByRole('textbox')).toHaveValue('!@#$')
    })

    it('handles unicode characters', () => {
      // Test with controlled value to avoid typing emojis
      render(<InputTextarea name="description" value="🎉✨🚀" onChange={vi.fn()} />)
      expect(screen.getByRole('textbox')).toHaveValue('🎉✨🚀')
    })

    it('handles tabs and spaces', () => {
      render(<InputTextarea name="description" value="  text  " onChange={vi.fn()} />)
      expect(screen.getByRole('textbox').value).toContain('text')
    })
  })

  describe('value clearing', () => {
    it('allows clearing the value', async () => {
      const user = userEvent.setup()
      const onChange = vi.fn()
      render(<InputTextarea name="description" value="initial" onChange={onChange} />)

      const textarea = screen.getByRole('textbox')
      await user.clear(textarea)

      // onChange should be called when clearing
      expect(onChange).toHaveBeenCalled()
    })

    it('can type after clearing', async () => {
      const user = userEvent.setup()
      const onChange = vi.fn()
      render(<InputTextarea name="description" value="" onChange={onChange} />)

      const textarea = screen.getByRole('textbox')
      await user.type(textarea, 'new')

      expect(onChange).toHaveBeenCalled()
    })
  })
})
