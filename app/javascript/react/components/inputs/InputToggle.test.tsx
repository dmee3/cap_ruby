import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import userEvent from '@testing-library/user-event'
import InputToggle from './InputToggle'

describe('InputToggle', () => {
  describe('rendering', () => {
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

  describe('accessibility', () => {
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
