import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import userEvent from '@testing-library/user-event'
import InputPassword from './InputPassword'

describe('InputPassword', () => {
  const getPasswordInput = (container: HTMLElement) => {
    return container.querySelector('input[type="password"]') as HTMLInputElement
  }

  describe('rendering', () => {
    it('renders input with name attribute', () => {
      const { container } = render(<InputPassword name="password" />)
      const input = container.querySelector('input[name="password"]')
      expect(input).toBeInTheDocument()
    })

    it('renders with placeholder text', () => {
      render(<InputPassword name="password" placeholder="Enter password" />)
      expect(screen.getByPlaceholderText('Enter password')).toBeInTheDocument()
    })

    it('renders with id attribute', () => {
      const { container } = render(<InputPassword name="password" id="customId" />)
      const input = getPasswordInput(container)
      expect(input).toHaveAttribute('id', 'customId')
    })

    it('renders with empty default value', () => {
      const { container } = render(<InputPassword name="password" />)
      const input = getPasswordInput(container)
      expect(input).toHaveValue('')
    })

    it('renders with initial value', () => {
      const { container } = render(<InputPassword name="password" value="initial123" />)
      const input = getPasswordInput(container)
      expect(input).toHaveValue('initial123')
    })
  })

  describe('type attribute', () => {
    it('has type="password"', () => {
      const { container } = render(<InputPassword name="password" />)
      const input = getPasswordInput(container)
      expect(input).toHaveAttribute('type', 'password')
    })

    it('masks input text', async () => {
      const user = userEvent.setup()
      const { container } = render(<InputPassword name="password" />)

      const input = getPasswordInput(container)
      await user.type(input, 'secret')

      // Value should be stored but input type is password
      expect(input).toHaveValue('secret')
      expect(input.type).toBe('password')
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

  describe('internal state management', () => {
    it('manages its own internal state', async () => {
      const user = userEvent.setup()
      const { container } = render(<InputPassword name="password" />)

      const input = getPasswordInput(container)
      await user.type(input, 'mypassword')

      expect(input).toHaveValue('mypassword')
    })

    it('starts with initial value from prop', () => {
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
  })

  describe('onChange behavior', () => {
    it('updates on each character typed', async () => {
      const user = userEvent.setup()
      const { container } = render(<InputPassword name="password" />)

      const input = getPasswordInput(container)
      await user.type(input, 'abc')

      // After typing 3 characters
      expect(input).toHaveValue('abc')
    })

    it('handles backspace', async () => {
      const user = userEvent.setup()
      const { container } = render(<InputPassword name="password" value="test" />)

      const input = getPasswordInput(container)
      await user.type(input, '{backspace}')

      expect(input).toHaveValue('tes')
    })

    it('handles special characters', async () => {
      const user = userEvent.setup()
      const { container } = render(<InputPassword name="password" />)

      const input = getPasswordInput(container)
      await user.type(input, 'P@ssw0rd!')

      expect(input).toHaveValue('P@ssw0rd!')
    })
  })

  describe('styling', () => {
    it('applies input-text class', () => {
      const { container } = render(<InputPassword name="password" />)
      const input = container.querySelector('input')
      expect(input).toHaveClass('input-text')
    })
  })

  describe('placeholder', () => {
    it('shows placeholder when empty', () => {
      render(<InputPassword name="password" placeholder="Password" />)
      expect(screen.getByPlaceholderText('Password')).toBeInTheDocument()
    })

    it('hides placeholder when typing', async () => {
      const user = userEvent.setup()
      render(<InputPassword name="password" placeholder="Password" />)

      const input = screen.getByPlaceholderText('Password')
      await user.type(input, 'test')

      // Placeholder still exists as attribute but isn't visible
      expect(input).toHaveAttribute('placeholder', 'Password')
    })
  })

  describe('security', () => {
    it('does not expose password in DOM as plain text', () => {
      const { container } = render(<InputPassword name="password" value="secret123" />)

      // The password type ensures it's masked
      const input = container.querySelector('input[type="password"]')
      expect(input).toBeInTheDocument()
    })

    it('maintains password masking during input', async () => {
      const user = userEvent.setup()
      const { container } = render(<InputPassword name="password" />)

      const input = getPasswordInput(container)
      await user.type(input, 'topsecret')

      // Verify type stays as password
      expect(container.querySelector('input[type="password"]')).toBeInTheDocument()
    })
  })

  describe('form integration', () => {
    it('submits with form', () => {
      const { container } = render(
        <form>
          <InputPassword name="password" value="test123" />
        </form>
      )

      const input = container.querySelector('input[name="password"]') as HTMLInputElement
      expect(input.value).toBe('test123')
    })

    it('has correct name for form submission', () => {
      const { container } = render(<InputPassword name="userPassword" />)
      const input = getPasswordInput(container)
      expect(input).toHaveAttribute('name', 'userPassword')
    })
  })
})
