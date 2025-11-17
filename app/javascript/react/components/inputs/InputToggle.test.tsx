import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import userEvent from '@testing-library/user-event'
import InputToggle from './InputToggle'

describe('InputToggle', () => {
  describe('rendering', () => {
    it('renders checkbox with correct attributes', () => {
      render(
        <InputToggle
          checked={false}
          id="testId"
          name="testName"
          onChange={vi.fn()}
          text="Toggle me"
        />
      )

      const checkbox = screen.getByRole('checkbox')
      expect(checkbox).toBeInTheDocument()
      expect(checkbox).toHaveAttribute('id', 'testId')
      expect(checkbox).toHaveAttribute('name', 'testName')
    })

    it('renders label with text', () => {
      render(
        <InputToggle
          checked={false}
          id="testId"
          name="testName"
          onChange={vi.fn()}
          text="Enable feature"
        />
      )

      expect(screen.getByText('Enable feature')).toBeInTheDocument()
    })

    it('associates label with checkbox via htmlFor', () => {
      const { container } = render(
        <InputToggle
          checked={false}
          id="myToggle"
          name="testName"
          onChange={vi.fn()}
          text="Toggle"
        />
      )

      const label = container.querySelector('label')
      expect(label).toHaveAttribute('for', 'myToggle')
    })

    it('has value="1" on checkbox', () => {
      render(
        <InputToggle
          checked={false}
          id="testId"
          name="testName"
          onChange={vi.fn()}
          text="Toggle"
        />
      )

      expect(screen.getByRole('checkbox')).toHaveAttribute('value', '1')
    })
  })

  describe('checked state', () => {
    it('renders unchecked when checked is false', () => {
      render(
        <InputToggle
          checked={false}
          id="testId"
          name="testName"
          onChange={vi.fn()}
          text="Toggle"
        />
      )

      expect(screen.getByRole('checkbox')).not.toBeChecked()
    })

    it('renders checked when checked is true', () => {
      render(
        <InputToggle
          checked={true}
          id="testId"
          name="testName"
          onChange={vi.fn()}
          text="Toggle"
        />
      )

      expect(screen.getByRole('checkbox')).toBeChecked()
    })
  })

  describe('onChange handler', () => {
    it('calls onChange with boolean value when clicked', async () => {
      const user = userEvent.setup()
      const onChange = vi.fn()

      render(
        <InputToggle
          checked={false}
          id="testId"
          name="testName"
          onChange={onChange}
          text="Toggle"
        />
      )

      const checkbox = screen.getByRole('checkbox')
      await user.click(checkbox)

      expect(onChange).toHaveBeenCalledWith(true)
    })

    it('passes boolean false when unchecking', async () => {
      const user = userEvent.setup()
      const onChange = vi.fn()

      render(
        <InputToggle
          checked={true}
          id="testId"
          name="testName"
          onChange={onChange}
          text="Toggle"
        />
      )

      const checkbox = screen.getByRole('checkbox')
      await user.click(checkbox)

      expect(onChange).toHaveBeenCalledWith(false)
    })

    it('can be toggled multiple times', async () => {
      const user = userEvent.setup()
      const onChange = vi.fn()

      render(
        <InputToggle
          checked={false}
          id="testId"
          name="testName"
          onChange={onChange}
          text="Toggle"
        />
      )

      const checkbox = screen.getByRole('checkbox')
      await user.click(checkbox)
      await user.click(checkbox)
      await user.click(checkbox)

      expect(onChange).toHaveBeenCalledTimes(3)
    })

    it('can be activated via label click', async () => {
      const user = userEvent.setup()
      const onChange = vi.fn()

      render(
        <InputToggle
          checked={false}
          id="testId"
          name="testName"
          onChange={onChange}
          text="Click me"
        />
      )

      await user.click(screen.getByText('Click me'))

      expect(onChange).toHaveBeenCalledWith(true)
    })
  })

  describe('styling classes', () => {
    it('applies correct wrapper class', () => {
      const { container } = render(
        <InputToggle
          checked={false}
          id="testId"
          name="testName"
          onChange={vi.fn()}
          text="Toggle"
        />
      )

      const label = container.querySelector('label')
      expect(label).toHaveClass('input-toggle-wrapper')
    })

    it('applies correct checkbox class', () => {
      render(
        <InputToggle
          checked={false}
          id="testId"
          name="testName"
          onChange={vi.fn()}
          text="Toggle"
        />
      )

      expect(screen.getByRole('checkbox')).toHaveClass('input-toggle')
    })

    it('renders toggle UI elements', () => {
      const { container } = render(
        <InputToggle
          checked={false}
          id="testId"
          name="testName"
          onChange={vi.fn()}
          text="Toggle"
        />
      )

      expect(container.querySelector('.input-toggle-bg')).toBeInTheDocument()
      expect(container.querySelector('.input-toggle-dot')).toBeInTheDocument()
    })

    it('applies label styling class', () => {
      const { container } = render(
        <InputToggle
          checked={false}
          id="testId"
          name="testName"
          onChange={vi.fn()}
          text="Toggle"
        />
      )

      const labelText = container.querySelector('.input-label')
      expect(labelText).toBeInTheDocument()
      expect(labelText).toHaveTextContent('Toggle')
    })
  })

  describe('accessibility', () => {
    it('has checkbox type', () => {
      render(
        <InputToggle
          checked={false}
          id="testId"
          name="testName"
          onChange={vi.fn()}
          text="Toggle"
        />
      )

      expect(screen.getByRole('checkbox')).toHaveAttribute('type', 'checkbox')
    })

    it('can be keyboard navigated', async () => {
      const user = userEvent.setup()
      const onChange = vi.fn()

      render(
        <InputToggle
          checked={false}
          id="testId"
          name="testName"
          onChange={onChange}
          text="Toggle"
        />
      )

      const checkbox = screen.getByRole('checkbox')
      checkbox.focus()
      await user.keyboard('[Space]')

      expect(onChange).toHaveBeenCalledWith(true)
    })
  })
})
