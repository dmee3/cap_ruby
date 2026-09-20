import React from 'react'
import { describe, expect, it } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import DeleteUserPanel, { DeleteUserData } from './DeleteUserPanel'

const base: DeleteUserData = {
  id: 7,
  full_name: 'Nadia Osei',
  first_name: 'Nadia',
  deleted: false,
  deleted_at: null,
  roster_line: 'On the 2026 roster.',
  removed: ['Their sign-in, so they can no longer log in', '1 recorded payment'],
  stays: ['Everything above is recoverable — nothing is erased from the database'],
}

const clone = (patch: Partial<DeleteUserData>): DeleteUserData => ({ ...base, ...patch })

const open = () => fireEvent.click(screen.getByRole('button', { name: 'Delete this person' }))

const deleteButton = () => screen.getByRole('button', { name: 'Delete Nadia Osei' })

describe('DeleteUserPanel', () => {
  it('keeps the confirm behind a disclosure, not next to Save', () => {
    render(<DeleteUserPanel data={base} csrfToken="t" />)

    expect(screen.queryByRole('button', { name: 'Delete Nadia Osei' })).toBeNull()
  })

  describe('the typed-name gate', () => {
    it('disables delete until the name matches', () => {
      render(<DeleteUserPanel data={base} csrfToken="t" />)
      open()

      expect(deleteButton()).toBeDisabled()

      fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Nadia' } })
      expect(deleteButton()).toBeDisabled()

      fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Nadia Osei' } })
      expect(deleteButton()).not.toBeDisabled()
    })

    // The gate is there to make someone read a name, not to test their typing.
    it('accepts a different case and stray whitespace', () => {
      render(<DeleteUserPanel data={base} csrfToken="t" />)
      open()

      fireEvent.change(screen.getByRole('textbox'), { target: { value: '  nadia osei ' } })

      expect(deleteButton()).not.toBeDisabled()
    })
  })

  // Opening the confirm and hitting Enter must not delete anyone.
  it('focuses the name field, never the destructive button', () => {
    render(<DeleteUserPanel data={base} csrfToken="t" />)
    open()

    expect(document.activeElement).toBe(screen.getByRole('textbox'))
  })

  it('cancels on Escape', () => {
    render(<DeleteUserPanel data={base} csrfToken="t" />)
    open()

    fireEvent.keyDown(document, { key: 'Escape' })

    expect(screen.queryByRole('button', { name: 'Delete Nadia Osei' })).toBeNull()
  })

  it('forgets a typed name when cancelled, so reopening starts gated', () => {
    render(<DeleteUserPanel data={base} csrfToken="t" />)
    open()
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Nadia Osei' } })
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    open()

    expect(deleteButton()).toBeDisabled()
  })

  it('shows both lists so the admin agrees to something specific', () => {
    render(<DeleteUserPanel data={base} csrfToken="t" />)
    open()

    expect(screen.getByText('1 recorded payment')).toBeTruthy()
    expect(
      screen.getByText('Everything above is recoverable — nothing is erased from the database')
    ).toBeTruthy()
  })

  describe('once someone is deleted', () => {
    it('offers Restore in place of the confirm', () => {
      render(<DeleteUserPanel data={clone({ deleted: true })} csrfToken="t" />)

      expect(screen.getByRole('button', { name: 'Restore Nadia' })).toBeTruthy()
      expect(screen.queryByRole('button', { name: 'Delete this person' })).toBeNull()
    })

    it('posts the restore to the restore route', () => {
      const { container } = render(<DeleteUserPanel data={clone({ deleted: true })} csrfToken="t" />)

      expect(container.querySelector('form')?.getAttribute('action')).toBe('/admin/users/7/restore')
    })
  })

  it('posts a DELETE, not a plain post to the update action', () => {
    const { container } = render(<DeleteUserPanel data={base} csrfToken="t" />)
    open()
    const form = container.querySelector('form')

    expect(form?.getAttribute('action')).toBe('/admin/users/7')
    expect(form?.querySelector('input[name="_method"]')?.getAttribute('value')).toBe('delete')
  })
})
