import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import userEvent from '@testing-library/user-event'
import InputPassword from './InputPassword'

describe('InputPassword', () => {
  const getPasswordInput = (container: HTMLElement) => {
    return container.querySelector('input[type="password"]') as HTMLInputElement
  }

  describe('rendering', () => {
    it('renders with empty default value', () => {
      const { container } = render(<InputPassword name="password" />)
      const input = getPasswordInput(container)
      expect(input).toHaveValue('')
    })

    it('has type="password"', () => {
      const { container } = render(<InputPassword name="password" />)
      const input = getPasswordInput(container)
      expect(input).toHaveAttribute('type', 'password')
    })
  })

  describe('internal state management', () => {
    it('seeds its internal state from the value prop', () => {
      const { container } = render(<InputPassword name="password" value="preset" />)
      const input = getPasswordInput(container)
      expect(input).toHaveValue('preset')
    })

    it('updates value on user input', async () => {
      const user = userEvent.setup()
      const { container } = render(<InputPassword name="password" value="" />)

      const input = getPasswordInput(container)
      await user.type(input, 'newpass')

      expect(input).toHaveValue('newpass')
    })

    it('allows clearing the value', async () => {
      const user = userEvent.setup()
      const { container } = render(<InputPassword name="password" value="initial" />)

      const input = getPasswordInput(container)
      await user.clear(input)

      expect(input).toHaveValue('')
    })

    it('handles backspace', async () => {
      const user = userEvent.setup()
      const { container } = render(<InputPassword name="password" value="test" />)

      const input = getPasswordInput(container)
      await user.type(input, '{backspace}')

      expect(input).toHaveValue('tes')
    })

    it('keeps its own edits when the value prop changes afterwards', async () => {
      const user = userEvent.setup()
      const { container, rerender } = render(<InputPassword name="password" value="first" />)

      const input = getPasswordInput(container)
      await user.clear(input)
      await user.type(input, 'typed')
      rerender(<InputPassword name="password" value="second" />)

      expect(getPasswordInput(container)).toHaveValue('typed')
    })
  })

  describe('autofocus', () => {
    it('does not autofocus by default', () => {
      const { container } = render(<InputPassword name="password" />)
      const input = getPasswordInput(container)
      expect(document.activeElement).not.toBe(input)
    })

    it('autofocuses when prop is true', () => {
      const { container } = render(<InputPassword name="password" autofocus={true} />)
      const input = getPasswordInput(container)
      expect(document.activeElement).toBe(input)
    })
  })

  describe('placeholder', () => {
    it('shows placeholder when empty', () => {
      render(<InputPassword name="password" placeholder="Password" />)
      expect(screen.getByPlaceholderText('Password')).toBeInTheDocument()
    })
  })
})
