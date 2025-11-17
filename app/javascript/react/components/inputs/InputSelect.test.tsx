import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import userEvent from '@testing-library/user-event'
import InputSelect from './InputSelect'

describe('InputSelect', () => {
  const defaultProps = {
    name: 'testSelect',
    onChange: vi.fn(),
    options: ['Option 1', 'Option 2', 'Option 3'],
    value: 'Option 1',
  }

  describe('rendering', () => {
    it('renders select with name attribute', () => {
      const { container } = render(<InputSelect {...defaultProps} />)
      const select = container.querySelector('select[name="testSelect"]')
      expect(select).toBeInTheDocument()
    })

    it('renders all options', () => {
      render(<InputSelect {...defaultProps} />)
      expect(screen.getByRole('option', { name: 'Option 1' })).toBeInTheDocument()
      expect(screen.getByRole('option', { name: 'Option 2' })).toBeInTheDocument()
      expect(screen.getByRole('option', { name: 'Option 3' })).toBeInTheDocument()
    })

    it('renders with id attribute', () => {
      render(<InputSelect {...defaultProps} id="customId" />)
      expect(screen.getByRole('combobox')).toHaveAttribute('id', 'customId')
    })

    it('renders with selected value', () => {
      render(<InputSelect {...defaultProps} value="Option 2" />)
      expect(screen.getByRole('combobox')).toHaveValue('Option 2')
    })

    it('renders with placeholder', () => {
      render(<InputSelect {...defaultProps} placeholder="Choose..." />)
      expect(screen.getByRole('combobox')).toHaveAttribute('placeholder', 'Choose...')
    })

    it('handles empty options array', () => {
      render(<InputSelect {...defaultProps} options={[]} />)
      const options = screen.queryAllByRole('option')
      expect(options).toHaveLength(0)
    })
  })

  describe('prompt option', () => {
    it('renders prompt option when provided', () => {
      render(<InputSelect {...defaultProps} prompt="-- Select --" />)
      expect(screen.getByRole('option', { name: '-- Select --' })).toBeInTheDocument()
    })

    it('does not render prompt option when not provided', () => {
      render(<InputSelect {...defaultProps} />)
      const options = screen.getAllByRole('option')
      expect(options).toHaveLength(3) // Only the 3 regular options
    })

    it('renders prompt before regular options', () => {
      render(<InputSelect {...defaultProps} prompt="Choose one" />)
      const options = screen.getAllByRole('option')
      expect(options[0]).toHaveTextContent('Choose one')
      expect(options[1]).toHaveTextContent('Option 1')
    })
  })

  describe('disabled state', () => {
    it('is enabled by default', () => {
      render(<InputSelect {...defaultProps} />)
      expect(screen.getByRole('combobox')).not.toBeDisabled()
    })

    it('can be disabled', () => {
      render(<InputSelect {...defaultProps} disabled={true} />)
      expect(screen.getByRole('combobox')).toBeDisabled()
    })

    it('prevents selection when disabled', async () => {
      const user = userEvent.setup()
      const onChange = vi.fn()
      render(<InputSelect {...defaultProps} onChange={onChange} disabled={true} />)

      const select = screen.getByRole('combobox')
      await user.click(select)

      expect(onChange).not.toHaveBeenCalled()
    })
  })

  describe('autofocus', () => {
    it('does not autofocus by default', () => {
      render(<InputSelect {...defaultProps} />)
      expect(document.activeElement).not.toBe(screen.getByRole('combobox'))
    })

    it('autofocuses when prop is true', () => {
      render(<InputSelect {...defaultProps} autofocus={true} />)
      expect(document.activeElement).toBe(screen.getByRole('combobox'))
    })
  })

  describe('onChange handler', () => {
    it('calls onChange with selected value', async () => {
      const user = userEvent.setup()
      const onChange = vi.fn()
      render(<InputSelect {...defaultProps} onChange={onChange} />)

      const select = screen.getByRole('combobox')
      await user.selectOptions(select, 'Option 2')

      expect(onChange).toHaveBeenCalledWith('Option 2')
    })

    it('calls onChange when selecting different option', async () => {
      const user = userEvent.setup()
      const onChange = vi.fn()
      render(<InputSelect {...defaultProps} onChange={onChange} value="Option 1" />)

      const select = screen.getByRole('combobox')
      await user.selectOptions(select, 'Option 3')

      expect(onChange).toHaveBeenCalledWith('Option 3')
    })

    it('handles multiple option changes', async () => {
      const user = userEvent.setup()
      const onChange = vi.fn()
      render(<InputSelect {...defaultProps} onChange={onChange} />)

      const select = screen.getByRole('combobox')
      await user.selectOptions(select, 'Option 2')
      await user.selectOptions(select, 'Option 3')
      await user.selectOptions(select, 'Option 1')

      expect(onChange).toHaveBeenCalledTimes(3)
      expect(onChange).toHaveBeenNthCalledWith(1, 'Option 2')
      expect(onChange).toHaveBeenNthCalledWith(2, 'Option 3')
      expect(onChange).toHaveBeenNthCalledWith(3, 'Option 1')
    })
  })

  describe('styling', () => {
    it('applies input-select class', () => {
      const { container } = render(<InputSelect {...defaultProps} />)
      const select = container.querySelector('select')
      expect(select).toHaveClass('input-select')
    })
  })

  describe('option values', () => {
    it('uses option text as value', () => {
      render(<InputSelect {...defaultProps} />)
      const option = screen.getByRole('option', { name: 'Option 1' }) as HTMLOptionElement
      expect(option.value).toBe('Option 1')
    })

    it('sets unique keys for options', () => {
      const { container } = render(<InputSelect {...defaultProps} />)
      const options = container.querySelectorAll('option')

      const keys = Array.from(options).map(opt => opt.getAttribute('value'))
      const uniqueKeys = new Set(keys)
      expect(uniqueKeys.size).toBe(keys.length)
    })
  })

  describe('special characters in options', () => {
    it('handles options with special characters', () => {
      const specialOptions = ['Option & More', 'Option <1>', 'Option "2"']
      render(<InputSelect {...defaultProps} options={specialOptions} value={specialOptions[0]} />)

      expect(screen.getByRole('option', { name: 'Option & More' })).toBeInTheDocument()
      expect(screen.getByRole('option', { name: 'Option <1>' })).toBeInTheDocument()
      expect(screen.getByRole('option', { name: 'Option "2"' })).toBeInTheDocument()
    })

    it('handles options with numbers', () => {
      const numberOptions = ['1', '2', '3']
      render(<InputSelect {...defaultProps} options={numberOptions} value="1" />)

      expect(screen.getByRole('option', { name: '1' })).toBeInTheDocument()
      expect(screen.getByRole('option', { name: '2' })).toBeInTheDocument()
      expect(screen.getByRole('option', { name: '3' })).toBeInTheDocument()
    })
  })

  describe('accessibility', () => {
    it('has combobox role', () => {
      render(<InputSelect {...defaultProps} />)
      expect(screen.getByRole('combobox')).toBeInTheDocument()
    })

    it('can be keyboard navigated', async () => {
      const user = userEvent.setup()
      const onChange = vi.fn()
      render(<InputSelect {...defaultProps} onChange={onChange} />)

      const select = screen.getByRole('combobox')
      select.focus()
      await user.keyboard('[ArrowDown]')

      expect(document.activeElement).toBe(select)
    })
  })
})
