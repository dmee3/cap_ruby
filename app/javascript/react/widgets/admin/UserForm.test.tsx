import React from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import UserForm, { UserFormData } from './UserForm'

const base: UserFormData = {
  user: {
    id: null,
    first_name: 'Iris',
    last_name: 'Nakamura',
    username: 'inakamura',
    email: 'iris@example.com',
    phone: null,
    reset_sent_at: null,
    seasons_users: [],
  },
  seasons: [
    { id: 2, year: '2026', current: true, vet: false },
    { id: 1, year: '2025', current: false, vet: false },
  ],
  errors: [],
  current_season_id: 2,
  sections: ['Snare', 'Visual'],
  ensembles: ['World', 'CC2'],
  roles: ['member', 'staff', 'coordinator', 'admin'],
}

const clone = (patch: Partial<UserFormData>): UserFormData => ({ ...base, ...patch })

const fields = (container: HTMLElement, name: string) =>
  Array.from(container.querySelectorAll<HTMLInputElement>(`input[name="${name}"]`)).map(i => i.value)

describe('UserForm', () => {
  // The schedule preview fetches on mount; stub it so teardown doesn't abort a
  // real request.
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve({}) }))
  })
  afterEach(() => vi.restoreAllMocks())

  it('posts to create with no _method override for a new person', () => {
    const { container } = render(<UserForm data={base} csrfToken="tok" />)

    const form = container.querySelector('form')!
    expect(form.getAttribute('action')).toBe('/admin/users')
    expect(container.querySelector('input[name="_method"]')).toBeNull()
    expect(screen.getByRole('button', { name: /create person and send welcome/i })).toBeTruthy()
  })

  it('posts to the member with a put override when editing', () => {
    const { container } = render(
      <UserForm data={clone({ user: { ...base.user, id: 42 } })} csrfToken="tok" />
    )

    expect(container.querySelector('form')!.getAttribute('action')).toBe('/admin/users/42')
    expect(container.querySelector<HTMLInputElement>('input[name="_method"]')!.value).toBe('put')
    // Edit never sets a password; a reset link is the only outward action.
    expect(screen.queryByText('Temporary password')).toBeNull()
    expect(screen.getByRole('button', { name: /send reset link/i })).toBeTruthy()
  })

  // The param shape is what Rails' nested attributes actually consume. A specs
  // that built params as a Ruby hash would hide a wrong name= here.
  it('emits the nested seasons_users names the controller expects', () => {
    const { container } = render(<UserForm data={base} csrfToken="tok" />)

    fireEvent.click(screen.getAllByRole('switch')[0])

    expect(fields(container, 'user[seasons_users_attributes][][season_id]')).toEqual(['2'])
    expect(fields(container, 'user[seasons_users_attributes][][role]')).toEqual(['member'])
  })

  // Turning a season off posts _destroy so only that row goes away.
  it('posts _destroy for a season that was on and is now off', () => {
    const data = clone({
      user: {
        ...base.user,
        id: 42,
        seasons_users: [{ id: 9, season_id: 2, role: 'member', ensemble: 'World', section: 'Snare' }],
      },
    })
    const { container } = render(<UserForm data={data} csrfToken="tok" />)

    fireEvent.click(screen.getAllByRole('switch')[0])

    expect(fields(container, 'user[seasons_users_attributes][][_destroy]')).toEqual(['1'])
    // The id must ride along, or Rails creates a second row instead.
    expect(fields(container, 'user[seasons_users_attributes][][id]')).toEqual(['9'])
  })

  it('summarises errors and says the typed values were kept', () => {
    const data = clone({
      errors: [
        { field: 'email', message: 'Email has already been taken' },
        { field: 'password', message: 'Password is too short (minimum is 8 characters)' },
      ],
    })
    render(<UserForm data={data} csrfToken="tok" />)

    expect(screen.getByText('2 things to fix')).toBeTruthy()
    expect(screen.getByText(/everything else you typed is still here/i)).toBeTruthy()
  })

  it('pluralises a single error', () => {
    render(<UserForm data={clone({ errors: [{ field: 'email', message: 'Email is invalid' }] })} csrfToken="tok" />)

    expect(screen.getByText('One thing to fix')).toBeTruthy()
  })
})
