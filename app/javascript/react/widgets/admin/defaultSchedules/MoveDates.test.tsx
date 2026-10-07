import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest'
import MoveDates from './MoveDates'
import { overview } from './fixtures'

beforeEach(() => {
  document.head.innerHTML = '<meta name="csrf-token" content="tok">'
})
afterEach(() => vi.restoreAllMocks())

describe('MoveDates', () => {
  it('lists each date once with every default that uses it', () => {
    render(<MoveDates data={overview()} />)

    expect(screen.getByText(/6 dates, each used by all 8 defaults/)).toBeInTheDocument()
    expect(screen.getAllByText('All 8 defaults')).toHaveLength(6)
    expect(screen.getByRole('button', { name: 'Move dates' })).toBeDisabled()
  })

  it('names a date only some defaults pay on by what they share', () => {
    const data = overview()
    data.dates = [...data.dates, '2026-11-20']
    data.combinations
      .filter(c => c.section_group === 'Visual')
      .forEach(c => c.entries.push({ pay_date: '2026-11-20', amount_cents: 1_000 }))

    render(<MoveDates data={data} />)

    expect(screen.getByText('4 of 8 · Visual')).toBeInTheDocument()
  })

  it('sends only the dates that moved', async () => {
    const fetchMock = vi
      .spyOn(global, 'fetch')
      .mockResolvedValue(new Response(JSON.stringify({ error: 'World · Music · Vet would clash.' }), { status: 422 }))
    render(<MoveDates data={overview()} />)

    fireEvent.change(screen.getByLabelText('Move payment 2, now 11/13/26, to'), { target: { value: '2026-11-20' } })
    expect(screen.getByText('Moves in all 8')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Move 1 date in 8 defaults' }))

    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('World · Music · Vet would clash.'))
    const [, init] = fetchMock.mock.calls[0]
    expect(JSON.parse(init!.body as string)).toEqual({ moves: [{ from: '2026-11-13', to: '2026-11-20' }] })
  })
})
