import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import RecipientPicker, { counterLabel, Recipient } from './RecipientPicker'

const recipients: Recipient[] = [
  { id: 1, name: 'Dana Reyes', initials: 'DR', detail: 'Admin · Snare' },
  { id: 2, name: 'Juli Navarro', initials: 'JN', detail: 'Admin' },
  { id: 3, name: 'Nikki Park', initials: 'NP', detail: null },
  { id: 4, name: 'Aaron Fisk', initials: 'AF', detail: 'Admin' }
]

describe('counterLabel', () => {
  it('counts toward the minimum', () => {
    expect(counterLabel(0, 3)).toBe('0 of 3 picked · 3 more')
    expect(counterLabel(1, 3)).toBe('1 of 3 picked · 2 more')
    expect(counterLabel(2, 3)).toBe('2 of 3 picked · one more')
  })

  it('says the minimum is met rather than counting past it', () => {
    expect(counterLabel(3, 3)).toBe('3 of 3 picked')
    expect(counterLabel(4, 3)).toBe('4 picked · minimum met')
  })

  it('drops the target when there is no pool to draw from', () => {
    expect(counterLabel(0, 0)).toBe('0 picked')
  })
})

describe('RecipientPicker', () => {
  it('names each person and what they do', () => {
    render(
      <RecipientPicker recipients={recipients} selected={[]} minimum={3} onChange={() => {}} />
    )

    expect(screen.getByText('Dana Reyes')).toBeInTheDocument()
    expect(screen.getByText('Admin · Snare')).toBeInTheDocument()
  })

  it('reports a selection and a deselection', () => {
    const onChange = vi.fn()
    const { rerender } = render(
      <RecipientPicker recipients={recipients} selected={[]} minimum={3} onChange={onChange} />
    )

    fireEvent.click(screen.getByLabelText(/Dana Reyes/))
    expect(onChange).toHaveBeenCalledWith([1])

    rerender(
      <RecipientPicker recipients={recipients} selected={[1]} minimum={3} onChange={onChange} />
    )
    fireEvent.click(screen.getByLabelText(/Dana Reyes/))
    expect(onChange).toHaveBeenCalledWith([])
  })

  it('posts the ids the server scopes against', () => {
    render(
      <RecipientPicker recipients={recipients} selected={[2]} minimum={3} onChange={() => {}} />
    )

    const checked = screen.getByLabelText(/Juli Navarro/) as HTMLInputElement
    expect(checked.name).toBe('recipients[]')
    expect(checked.value).toBe('2')
    expect(checked.checked).toBe(true)
  })

  // 44px, so a row is a touch target on the phone this gets filled in on.
  it('keeps every row a full touch target', () => {
    const { container } = render(
      <RecipientPicker recipients={recipients} selected={[]} minimum={3} onChange={() => {}} />
    )

    container.querySelectorAll('label').forEach(row => {
      expect(row.className).toContain('min-h-[44px]')
    })
  })

  it('stays quiet until a submit has actually failed', () => {
    const { container, rerender } = render(
      <RecipientPicker recipients={recipients} selected={[]} minimum={3} onChange={() => {}} />
    )
    expect(container.querySelector('.ring-danger-fg')).toBeNull()

    rerender(
      <RecipientPicker recipients={recipients} selected={[]} minimum={3} onChange={() => {}} invalid />
    )
    expect(container.querySelector('.ring-danger-fg')).not.toBeNull()
  })
})
