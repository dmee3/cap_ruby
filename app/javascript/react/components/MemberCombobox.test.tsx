import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import MemberCombobox from './MemberCombobox'

const members = [
  { id: 1, name: 'Elena Sokol', section: 'Front Ensemble / Vibes' },
  { id: 2, name: 'Rae Quinn', section: 'Battery / Snare' },
  { id: 3, name: 'Marcus Vale', section: 'Battery / Bass' },
]

const setup = (props = {}) => {
  const onChange = vi.fn()
  const view = render(
    <MemberCombobox members={members} value="" onChange={onChange} name="payment[user_id]" {...props} />,
  )
  return { onChange, ...view }
}

describe('MemberCombobox', () => {
  it('exposes a hidden input so a real form POST still carries the id', () => {
    const { container } = setup({ value: '2' })
    expect(container.querySelector('input[type="hidden"][name="payment[user_id]"]')).toHaveValue('2')
  })

  it('is an ARIA combobox wired to its listbox', async () => {
    setup()
    const input = screen.getByRole('combobox')
    expect(input).toHaveAttribute('aria-expanded', 'false')

    await userEvent.click(input)
    expect(input).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByRole('listbox')).toBeInTheDocument()
  })

  it('filters as you type', async () => {
    setup()
    await userEvent.type(screen.getByRole('combobox'), 'quinn')

    expect(screen.getByRole('option', { name: /Rae Quinn/ })).toBeInTheDocument()
    expect(screen.queryByRole('option', { name: /Elena Sokol/ })).not.toBeInTheDocument()
  })

  it('matches across a gap, so initials-plus-surname finds someone', async () => {
    setup()
    await userEvent.type(screen.getByRole('combobox'), 'esokol')
    expect(screen.getByRole('option', { name: /Elena Sokol/ })).toBeInTheDocument()
  })

  it('matches a surname typed on its own', async () => {
    setup()
    await userEvent.type(screen.getByRole('combobox'), 'vale')
    expect(screen.getByRole('option', { name: /Marcus Vale/ })).toBeInTheDocument()
    expect(screen.queryByRole('option', { name: /Elena Sokol/ })).not.toBeInTheDocument()
  })

  it('matches on section as well as name', async () => {
    setup()
    await userEvent.type(screen.getByRole('combobox'), 'vibes')
    expect(screen.getByRole('option', { name: /Elena Sokol/ })).toBeInTheDocument()
  })

  it('selects with a click', async () => {
    const { onChange } = setup()
    await userEvent.click(screen.getByRole('combobox'))
    await userEvent.click(screen.getByRole('option', { name: /Marcus Vale/ }))
    expect(onChange).toHaveBeenCalledWith('3')
  })

  it('navigates and selects with the keyboard', async () => {
    const { onChange } = setup()
    const input = screen.getByRole('combobox')
    await userEvent.click(input)
    await userEvent.keyboard('{ArrowDown}{Enter}')
    // first option is active by default, ArrowDown moves to the second
    expect(onChange).toHaveBeenCalledWith('2')
  })

  it('closes on Escape without selecting', async () => {
    const { onChange } = setup()
    const input = screen.getByRole('combobox')
    await userEvent.click(input)
    await userEvent.keyboard('{Escape}')

    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
    expect(onChange).not.toHaveBeenCalled()
  })

  it('shows the selection and can clear it', async () => {
    const { onChange } = setup({ value: '1' })
    expect(screen.getByText('Elena Sokol')).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Clear selected member' }))
    expect(onChange).toHaveBeenCalledWith('')
  })

  it('says so when nothing matches', async () => {
    setup()
    await userEvent.type(screen.getByRole('combobox'), 'zzzzzz')
    expect(screen.getByText(/No member matches/)).toBeInTheDocument()
  })
})
