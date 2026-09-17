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
    it('renders all options', () => {
      render(<InputSelect {...defaultProps} />)
      expect(screen.getByRole('option', { name: 'Option 1' })).toBeInTheDocument()
      expect(screen.getByRole('option', { name: 'Option 2' })).toBeInTheDocument()
      expect(screen.getByRole('option', { name: 'Option 3' })).toBeInTheDocument()
    })

    it('renders with selected value', () => {
      render(<InputSelect {...defaultProps} value="Option 2" />)
      expect(screen.getByRole('combobox')).toHaveValue('Option 2')
    })

    it('handles empty options array', () => {
      render(<InputSelect {...defaultProps} options={[]} />)
      const options = screen.queryAllByRole('option')
      expect(options).toHaveLength(0)
    })

    it('uses option text as value', () => {
      render(<InputSelect {...defaultProps} />)
      const option = screen.getByRole('option', { name: 'Option 1' }) as HTMLOptionElement
      expect(option.value).toBe('Option 1')
    })
  })

  describe('prompt option', () => {
    it('does not render prompt option when not provided', () => {
      render(<InputSelect {...defaultProps} />)
      const options = screen.getAllByRole('option')
      expect(options).toHaveLength(3)
    })

    it('renders prompt before regular options', () => {
      render(<InputSelect {...defaultProps} prompt="Choose one" />)
      const options = screen.getAllByRole('option')
      expect(options[0]).toHaveTextContent('Choose one')
      expect(options[1]).toHaveTextContent('Option 1')
    })
  })

  describe('disabled state', () => {
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
    it('calls onChange with the selected value rather than the event', async () => {
      const user = userEvent.setup()
      const onChange = vi.fn()
      render(<InputSelect {...defaultProps} onChange={onChange} />)

      const select = screen.getByRole('combobox')
      await user.selectOptions(select, 'Option 2')

      expect(onChange).toHaveBeenCalledWith('Option 2')
    })
  })

  describe('accessibility', () => {
    it('has combobox role', () => {
      render(<InputSelect {...defaultProps} />)
      expect(screen.getByRole('combobox')).toBeInTheDocument()
    })
  })
})
