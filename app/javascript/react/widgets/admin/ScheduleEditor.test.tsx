import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import ScheduleEditor, { ScheduleEditorData } from './ScheduleEditor'

const data: ScheduleEditorData = {
  schedule_id: 3,
  season_label: '2026',
  member: {
    id: 9,
    name: 'Sam Reed',
    ensemble: 'World',
    section: 'Snare',
    vet: true,
    member_type: 'Vet',
  },
  paid_cents: 50_000,
  planned_cents: 90_000,
  locked_count: 1,
  matches_default: false,
  entries: [
    {
      id: 1,
      pay_date: '2025-10-17',
      amount_cents: 50_000,
      status: 'paid',
      days_late: null,
      covered_on: '10/18',
    },
    {
      id: 2,
      pay_date: '2026-02-06',
      amount_cents: 40_000,
      status: 'due-next',
      days_late: null,
      covered_on: null,
    },
  ],
}

const okJson = (body: unknown) =>
  Promise.resolve({ ok: true, json: () => Promise.resolve(body) } as Response)

const previewBody = {
  entries: [],
  locked_count: 1,
  diff: [
    {
      pay_date: '2025-10-17',
      from_date: '2025-10-17',
      to_date: '2025-10-17',
      kind: 'unchanged',
      from_cents: 50_000,
      to_cents: 50_000,
      locked: true,
    },
    {
      pay_date: '2026-03-06',
      from_date: null,
      to_date: '2026-03-06',
      kind: 'added',
      from_cents: null,
      to_cents: 40_000,
      locked: false,
    },
  ],
}

const fetchCalls = () =>
  (fetch as unknown as ReturnType<typeof vi.fn>).mock.calls as [string, RequestInit?][]

beforeEach(() => {
  document.head.innerHTML = '<meta name="csrf-token" content="tok">'
  vi.stubGlobal(
    'fetch',
    vi.fn((url: string) => {
      if (url.includes('default-preview')) return okJson(previewBody)
      return okJson({})
    }),
  )
})

afterEach(() => vi.unstubAllGlobals())

describe('ScheduleEditor', () => {
  it('renders the timeline card with a paid-of-planned summary', () => {
    render(<ScheduleEditor data={data} />)
    const title = screen.getByText('How this schedule is going')
    expect(screen.getByText('$500 paid of $900 planned')).toBeInTheDocument()
  })

  it('renders a table row per entry with a running total footer', () => {
    render(<ScheduleEditor data={data} />)
    expect(screen.getByText('Due date')).toBeInTheDocument()
    expect(screen.getByText('Total $900')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '+ Add a payment date' })).toBeInTheDocument()
  })

  // Paid rows stay editable: fixing a mistyped amount on a covered
  // installment is ordinary work. Preserving them is the RESET action's job,
  // not the editor's.
  it('lets every row be edited and removed, paid ones included', () => {
    render(<ScheduleEditor data={data} />)
    expect(screen.getByLabelText('Due date for payment 1')).not.toBeDisabled()
    expect(screen.getByRole('button', { name: 'Remove payment 1' })).toBeInTheDocument()
    expect(screen.getByLabelText('Due date for payment 2')).not.toBeDisabled()
    expect(screen.getByRole('button', { name: 'Remove payment 2' })).toBeInTheDocument()
  })

  it('still marks a paid row as paid — the status is information, not a lock', () => {
    render(<ScheduleEditor data={data} />)
    expect(screen.getByText('Paid 10/18')).toBeInTheDocument()
  })

  it('tracks an edit to a paid row as an unsaved change', async () => {
    const { container } = render(<ScheduleEditor data={data} />)
    // entry 1 is the paid one
    const paidAmount = container.querySelector('#entry-1') as HTMLInputElement

    await userEvent.clear(paidAmount)
    await userEvent.type(paidAmount, '450')

    expect(paidAmount).toHaveValue('450')
    expect(screen.getByText('Unsaved changes')).toBeInTheDocument()
    // and the new figure reaches the running total
    expect(screen.getByText('Total $850')).toBeInTheDocument()
  })

  it('names the date a paid row was actually covered', () => {
    render(<ScheduleEditor data={data} />)
    expect(screen.getByText('Paid 10/18')).toBeInTheDocument()
  })

  it('tracks a moved date and shows the unsaved indicator', async () => {
    render(<ScheduleEditor data={data} />)
    const date = screen.getByLabelText('Due date for payment 2')
    await userEvent.clear(date)
    await userEvent.type(date, '2026-03-01')

    expect(screen.getByText('Unsaved changes')).toBeInTheDocument()
    expect(screen.getByText(/Moved from 2\/6/)).toBeInTheDocument()
  })

  it('calls the schedule "unedited" only while it still matches the default', () => {
    render(<ScheduleEditor data={{ ...data, matches_default: true }} />)
    expect(screen.getByText('Default vet schedule, unedited')).toBeInTheDocument()
  })

  it('asks before resetting, and only applies on confirm', async () => {
    render(<ScheduleEditor data={data} />)
    await waitFor(() => expect(screen.getByText('Differs from the vet default')).toBeInTheDocument())

    await userEvent.click(screen.getByRole('button', { name: 'Reset to default' }))
    expect(screen.getByText('Reset to default?')).toBeInTheDocument()
    expect(
      fetchCalls().some(([url]) => url === '/api/admin/payment_schedules/apply-default'),
      'nothing applied before confirming',
    ).toBe(false)

    await userEvent.click(screen.getByRole('button', { name: 'Apply default' }))
    await waitFor(() => {
      expect(
        fetchCalls().some(
          ([url, opts]) => url === '/api/admin/payment_schedules/apply-default' && opts?.method === 'POST',
        ),
      ).toBe(true)
    })
  })

  it('backs out of the reset confirm without applying', async () => {
    render(<ScheduleEditor data={data} />)
    await waitFor(() => screen.getByText('Differs from the vet default'))

    await userEvent.click(screen.getByRole('button', { name: 'Reset to default' }))
    await userEvent.click(screen.getByRole('button', { name: 'Keep mine' }))

    expect(screen.getByText('Differs from the vet default')).toBeInTheDocument()
    expect(fetchCalls().some(([url]) => url.includes('apply-default'))).toBe(false)
  })

  it('PUTs nested attributes on save', async () => {
    render(<ScheduleEditor data={data} />)
    await userEvent.click(screen.getByRole('button', { name: 'Save schedule' }))

    await waitFor(() => {
      const put = fetchCalls().find(
        ([url, opts]) => url === '/api/admin/payment_schedules/3' && opts?.method === 'PUT',
      )
      expect(put).toBeTruthy()
      expect(String(put?.[1]?.body)).toContain('payment_schedule_entries_attributes')
    })
  })
})
