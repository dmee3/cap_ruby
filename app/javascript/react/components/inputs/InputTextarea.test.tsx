import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import userEvent from '@testing-library/user-event'
import { createRef } from 'react'
import InputTextarea from './InputTextarea'
import React from 'react'

describe('InputTextarea', () => {
  describe('rendering', () => {
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
  })

  it('merges a custom className with its own', () => {
    const { container } = render(<InputTextarea name="test" className="custom-class" />)
    const textarea = container.querySelector('textarea')
    expect(textarea).toHaveClass('input-text')
    expect(textarea).toHaveClass('custom-class')
  })

  describe('disabled state', () => {
    it('prevents typing when disabled', async () => {
      const user = userEvent.setup()
      render(<InputTextarea name="description" disabled={true} value="" />)
      const textarea = screen.getByRole('textbox')

      await user.type(textarea, 'test')
      expect(textarea).toHaveValue('')
    })
  })

  describe('onChange handler', () => {
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

    it('is uncontrolled when no onChange is given, so typing still updates it', async () => {
      const user = userEvent.setup()
      render(<InputTextarea name="description" value="start" />)

      const textarea = screen.getByRole('textbox')
      await user.type(textarea, '!')

      expect(textarea).toHaveValue('start!')
    })

    it('is controlled when onChange is given, so the value prop wins over typing', async () => {
      const user = userEvent.setup()
      const onChange = vi.fn()
      render(<InputTextarea name="description" value="fixed" onChange={onChange} />)

      const textarea = screen.getByRole('textbox')
      await user.type(textarea, 'more')

      expect(onChange).toHaveBeenCalled()
      expect(textarea).toHaveValue('fixed')
    })
  })

  describe('ref forwarding', () => {
    it('forwards ref to textarea element', () => {
      const ref = createRef<HTMLTextAreaElement>()
      render(<InputTextarea name="description" ref={ref} />)

      expect(ref.current).toBeInstanceOf(HTMLTextAreaElement)
    })
  })
})
