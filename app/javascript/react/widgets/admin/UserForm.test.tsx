import React from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
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
    initials: 'IN',
    summary: [],
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
    // Member 360 lives in the header card as a button, not a bare link.
    expect(screen.getByRole('link', { name: /open member 360/i })).toBeTruthy()
    expect(container.querySelector<HTMLInputElement>('input[name="_method"]')!.value).toBe('put')
    // Edit never sets a password; a reset link is the only outward action.
    expect(screen.queryByText('Temporary password')).toBeNull()
    expect(screen.getByRole('button', { name: /send reset link/i })).toBeTruthy()
  })

  // The param shape is what Rails' nested attributes actually consume. A spec
  // that built params as a Ruby hash would hide a wrong name= here.
  it('emits the nested seasons_users names the controller expects', () => {
    const { container } = render(<UserForm data={base} csrfToken="tok" />)

    fireEvent.click(screen.getAllByRole('switch')[0])

    expect(fields(container, 'user[seasons_users_attributes][0][season_id]')).toEqual(['2'])
    expect(fields(container, 'user[seasons_users_attributes][0][role]')).toEqual(['member'])
  })

  // Indices, not `[]`. With `[]`, Rack starts a new hash only on a REPEATED
  // key, so a new season (no id) swallows the id of the next group and every
  // row shifts by one — which retargeted an existing row at the wrong season
  // and tried to create a duplicate for the old one.
  it('indexes each season group so a new row cannot absorb an existing id', () => {
    const data = clone({
      user: {
        ...base.user,
        id: 42,
        seasons_users: [
          { id: 1935, season_id: 1, role: 'member', ensemble: 'CC2', section: 'Auxiliary' },
        ],
      },
      seasons: [
        { id: 2, year: '2027', current: true, vet: true },
        { id: 1, year: '2026', current: false, vet: false },
      ],
      current_season_id: 2,
    })
    const { container } = render(<UserForm data={data} csrfToken="tok" />)

    // Turn 2027 on: it has no id, and is rendered BEFORE the 2026 row that has one.
    fireEvent.click(screen.getAllByRole('switch')[0])

    // The id belongs to the 2026 group (index 1), never the new 2027 group.
    expect(fields(container, 'user[seasons_users_attributes][0][id]')).toEqual([])
    expect(fields(container, 'user[seasons_users_attributes][0][season_id]')).toEqual(['2'])
    expect(fields(container, 'user[seasons_users_attributes][1][id]')).toEqual(['1935'])
    expect(fields(container, 'user[seasons_users_attributes][1][season_id]')).toEqual(['1'])
    // And no positional `[]` names survive.
    expect(fields(container, 'user[seasons_users_attributes][][id]')).toEqual([])
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

    expect(fields(container, 'user[seasons_users_attributes][0][_destroy]')).toEqual(['1'])
    // The id must ride along, or Rails creates a second row instead.
    expect(fields(container, 'user[seasons_users_attributes][0][id]')).toEqual(['9'])
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

  it('shows the header card with initials and derived summary when editing', () => {
    const data = clone({
      user: {
        ...base.user,
        id: 42,
        initials: 'GH',
        first_name: 'Gus',
        last_name: 'Halloway',
        summary: ['@ghalloway', '4th season', 'Vet', 'World / Metals'],
      },
    })
    render(<UserForm data={data} csrfToken="tok" />)

    expect(screen.getByText('GH')).toBeTruthy()
    expect(screen.getByText('Gus Halloway')).toBeTruthy()
    expect(screen.getByText('@ghalloway · 4th season · Vet · World / Metals')).toBeTruthy()
  })

  it('has no header card on the create screen', () => {
    render(<UserForm data={base} csrfToken="tok" />)

    expect(screen.queryByRole('link', { name: /open member 360/i })).toBeNull()
  })

  // The panel used to say "2027 only. Past seasons create nothing", which was
  // create-screen framing AND factually wrong: ensure_payment_schedules_for_user
  // walks every member season, so adding someone to a past season does create
  // a schedule for it.
  describe('the what-happens panel on edit', () => {
    const editing = (seasonsUsers: UserFormData['user']['seasons_users']) =>
      clone({
        user: { ...base.user, id: 42, seasons_users: seasonsUsers },
        seasons: [
          { id: 3, year: '2027', current: true, vet: true },
          { id: 2, year: '2026', current: false, vet: false },
        ],
        current_season_id: 3,
      })

    it('names the season a schedule is actually created for, not the current one', () => {
      // On 2027 already (with a schedule); the admin adds 2026 as well.
      render(
        <UserForm
          data={editing([
            { id: 9, season_id: 3, role: 'member', ensemble: 'World', section: 'Snare', has_schedule: true },
            { id: 10, season_id: 2, role: 'member', ensemble: 'World', section: 'Snare', has_schedule: false },
          ])}
          csrfToken="tok"
        />
      )

      expect(screen.getByText(/A payment schedule is created for 2026\./)).toBeTruthy()
      expect(screen.queryByText(/Past seasons create nothing/)).toBeNull()
    })

    it('says nothing new is created when every member season already has one', () => {
      render(
        <UserForm
          data={editing([
            { id: 9, season_id: 3, role: 'member', ensemble: 'World', section: 'Snare', has_schedule: true },
          ])}
          csrfToken="tok"
        />
      )

      expect(screen.getByText(/No new payment schedules\./)).toBeTruthy()
    })

    // The steps are fixed rather than branching per toggle state, so turning a
    // season off doesn't add or remove a step; only the schedule line varies.
    it('keeps the same three steps when a season is toggled off', () => {
      const { container } = render(
        <UserForm
          data={editing([
            { id: 9, season_id: 3, role: 'member', ensemble: 'World', section: 'Snare', has_schedule: true },
          ])}
          csrfToken="tok"
        />
      )

      expect(container.querySelectorAll('ol li')).toHaveLength(3)
      fireEvent.click(container.querySelectorAll('[role="switch"]')[0])
      expect(container.querySelectorAll('ol li')).toHaveLength(3)
    })

    // The reported case: on 2027, removed from it, added to 2026 as a member.
    it('names 2026 when the member is added there, not the current season', () => {
      render(
        <UserForm
          data={editing([
            { id: 10, season_id: 2, role: 'member', ensemble: 'World', section: 'Snare', has_schedule: false },
          ])}
          csrfToken="tok"
        />
      )

      expect(screen.getByText('A payment schedule is created for 2026.')).toBeTruthy()
    })

    // The preview used to be hardwired to the current season, so a 2026 member
    // viewed during 2027 got a 2027 forecast sitting next to a panel promising
    // a 2026 schedule. The two must name the same season.
    it('previews the season a schedule is created for, not the current one', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue({
          ok: true,
          json: () =>
            Promise.resolve({
              entries: [{ pay_date: '2025-10-17', amount_cents: 50_000 }],
              total_cents: 50_000,
              lookup_key: 'World · Music · Rookie',
              past_due: { count: 0, amount_cents: 0 },
            }),
        })
      )
      render(
        <UserForm
          data={editing([
            { id: 10, season_id: 2, role: 'member', ensemble: 'World', section: 'Snare', has_schedule: false },
          ])}
          csrfToken="tok"
        />
      )

      expect(screen.getByText('A payment schedule is created for 2026.')).toBeTruthy()
      // Same season named in the preview box.
      await waitFor(() => expect(screen.getByText('2026 schedule preview')).toBeTruthy())
    })

    it('has no em-dash in the no-schedule copy', () => {
      render(
        <UserForm
          data={editing([
            { id: 9, season_id: 3, role: 'member', ensemble: 'World', section: 'Snare', has_schedule: true },
          ])}
          csrfToken="tok"
        />
      )

      expect(screen.getByText(/No new payment schedules\./).textContent).not.toContain('—')
    })
  })

  describe('the quartermaster grant against a role that already has inventory', () => {
    const withCurrentRole = (role: string, inventory_access = false) =>
      clone({
        user: {
          ...base.user,
          id: 42,
          inventory_access,
          seasons_users: [{ id: 9, season_id: 2, role, ensemble: '', section: '' }],
        },
      })

    it('lets a staff person be made a quartermaster', () => {
      const { container } = render(<UserForm data={withCurrentRole('staff')} csrfToken="tok" />)

      expect(container.querySelector('input[type="checkbox"][name="user[inventory_access]"]')).toBeTruthy()
      expect(screen.queryByText(/already grants this/)).toBeNull()
    })

    it('takes the decision away while they are a coordinator', () => {
      const { container } = render(<UserForm data={withCurrentRole('coordinator')} csrfToken="tok" />)

      expect(container.querySelector('input[type="checkbox"][name="user[inventory_access]"]')).toBeNull()
      expect(screen.getByText(/their coordinator role this season already grants this/i)).toBeTruthy()
    })

    it('takes the decision away while they are an admin', () => {
      render(<UserForm data={withCurrentRole('admin')} csrfToken="tok" />)

      expect(screen.getByText(/their admin role this season already grants this/i)).toBeTruthy()
    })

    it('posts a stored grant back untouched, so a coordinator keeps it for the season they step back', () => {
      const { container } = render(<UserForm data={withCurrentRole('coordinator', true)} csrfToken="tok" />)

      expect(fields(container, 'user[inventory_access]')).toEqual(['1'])
    })

    it('does not invent a grant for a coordinator who never had one', () => {
      const { container } = render(<UserForm data={withCurrentRole('coordinator', false)} csrfToken="tok" />)

      expect(fields(container, 'user[inventory_access]')).toEqual(['0'])
    })

    it('hands the decision back as soon as the role is lowered, before any save', async () => {
      const { container } = render(<UserForm data={withCurrentRole('coordinator')} csrfToken="tok" />)

      const roleGroup = screen.getByRole('group', { name: 'Role for 2026' })
      fireEvent.click(within(roleGroup).getByRole('button', { name: /^staff$/i }))

      await waitFor(() =>
        expect(container.querySelector('input[type="checkbox"][name="user[inventory_access]"]')).toBeTruthy()
      )
      expect(screen.queryByText(/already grants this/)).toBeNull()
    })

    it('ignores an elevated role held only in a past season', () => {
      const { container } = render(
        <UserForm
          data={clone({
            user: {
              ...base.user,
              id: 42,
              seasons_users: [
                { id: 9, season_id: 2, role: 'staff', ensemble: '', section: '' },
                { id: 8, season_id: 1, role: 'coordinator', ensemble: '', section: '' },
              ],
            },
          })}
          csrfToken="tok"
        />
      )

      expect(container.querySelector('input[type="checkbox"][name="user[inventory_access]"]')).toBeTruthy()
    })
  })

  it('pluralises a single error', () => {
    render(<UserForm data={clone({ errors: [{ field: 'email', message: 'Email is invalid' }] })} csrfToken="tok" />)

    expect(screen.getByText('One thing to fix')).toBeTruthy()
  })
})
