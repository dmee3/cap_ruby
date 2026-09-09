import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import ScheduleEditor, { ScheduleEditorData } from './ScheduleEditor'

const data: ScheduleEditorData = {
  schedule_id: 3,
  member: { id: 9, name: 'Sam Reed', ensemble: 'World', section: 'Snare', vet: true },
  paid_cents: 50_000,
  planned_cents: 90_000,
  entries: [
    { id: 1, pay_date: '2025-10-17', amount_cents: 50_000, status: 'paid', days_late: null },
    { id: 2, pay_date: '2026-02-06', amount_cents: 40_000, status: 'due-next', days_late: null },
  ],
}

const okJson = (body: unknown) =>
  Promise.resolve({ ok: true, json: () => Promise.resolve(body) } as Response)

const previewBody = {
  entries: [],
  diff: [
    { pay_date: '2025-10-17', kind: 'unchanged', from_cents: 50_000, to_cents: 50_000, locked: true },
    { pay_date: '2026-03-06', kind: 'added', from_cents: null, to_cents: 40_000, locked: false },
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
  it('renders the timeline headline and one editable row per entry', async () => {
    render(<ScheduleEditor data={data} />)
    expect(screen.getByText('$500 paid of $900 planned')).toBeInTheDocument()
    expect(screen.getAllByLabelText('Amount')).toHaveLength(2)
  })

  it('tracks a moved date and shows the "Unsaved changes" indicator', async () => {
    render(<ScheduleEditor data={data} />)
    const dateInputs = screen.getAllByDisplayValue(/2026-02-06|2025-10-17/)
    await userEvent.clear(dateInputs[1])
    await userEvent.type(dateInputs[1], '2026-03-01')

    expect(screen.getByText('Unsaved changes')).toBeInTheDocument()
    expect(screen.getByText(/Moved from 2\/6/)).toBeInTheDocument()
  })

  it('fetches the default preview and renders the diff panel', async () => {
    render(<ScheduleEditor data={data} />)
    await waitFor(() => expect(screen.getByText('Differs from the vet default')).toBeInTheDocument())
    expect(screen.getByText('+ $400 added')).toBeInTheDocument()
    expect(screen.getByText('$500 · paid, kept as-is')).toBeInTheDocument()
  })

  it('PUTs nested attributes on save', async () => {
    render(<ScheduleEditor data={data} />)
    await screen.findAllByLabelText('Amount')

    await userEvent.click(screen.getByRole('button', { name: 'Save schedule' }))

    await waitFor(() => {
      const put = fetchCalls().find(
        ([url, opts]) => url === '/api/admin/payment_schedules/3' && opts?.method === 'PUT',
      )
      expect(put).toBeTruthy()
      expect(String(put?.[1]?.body)).toContain('payment_schedule_entries_attributes')
    })
  })

  it('POSTs apply-default when the diff panel action is used', async () => {
    render(<ScheduleEditor data={data} />)
    await waitFor(() => screen.getByText('Differs from the vet default'))

    await userEvent.click(screen.getByRole('button', { name: 'Apply default' }))

    await waitFor(() => {
      expect(
        fetchCalls().some(
          ([url, opts]) => url === '/api/admin/payment_schedules/apply-default' && opts?.method === 'POST',
        ),
      ).toBe(true)
    })
  })
})
