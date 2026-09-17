import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import WhistleblowerForm from './WhistleblowerForm'

const recipients = [
  { id: 1, name: 'Dana Reyes', initials: 'DR', detail: 'Admin' },
  { id: 2, name: 'Juli Navarro', initials: 'JN', detail: 'Admin' },
  { id: 3, name: 'Nikki Park', initials: 'NP', detail: 'Admin' }
]

const renderForm = (data = { recipients, minimum: 3 }) =>
  render(<WhistleblowerForm data={data} csrfToken="token" />)

describe('WhistleblowerForm', () => {
  it('keeps the no-retaliation promise on the form itself', () => {
    renderForm()

    expect(screen.getByText(/Anonymous is fine/)).toBeInTheDocument()
  })

  it('explains the three-person rule rather than just enforcing it', () => {
    renderForm()

    expect(screen.getByText(/No one person can decide what happens/)).toBeInTheDocument()
  })

  it('holds its errors back until a submit is attempted', () => {
    const { container } = renderForm()

    expect(screen.queryByText(/We didn't send this yet/)).toBeNull()

    fireEvent.submit(container.querySelector('form') as HTMLFormElement)

    expect(screen.getByText(/We didn't send this yet/)).toBeInTheDocument()
    expect(screen.getByText(/the report is empty/)).toBeInTheDocument()
    expect(screen.getByText(/Pick 3 more people/)).toBeInTheDocument()
  })

  it('keeps what was typed when a submit fails', () => {
    const { container } = renderForm()
    const textarea = screen.getByLabelText('What happened') as HTMLTextAreaElement

    fireEvent.change(textarea, { target: { value: 'Something happened' } })
    fireEvent.submit(container.querySelector('form') as HTMLFormElement)

    expect((screen.getByLabelText('What happened') as HTMLTextAreaElement).value).toBe(
      'Something happened'
    )
  })

  // No backfill by design, so an empty pool is what the screen looks like on
  // the day the flag ships.
  it('says reports cannot be sent rather than drawing an empty picker', () => {
    render(<WhistleblowerForm data={{ recipients: [], minimum: 0 }} csrfToken="token" />)

    expect(screen.getByText(/Reports can't be sent yet/)).toBeInTheDocument()
    expect(screen.queryByLabelText('What happened')).toBeNull()
  })

  it('asks for the whole pool when fewer than three people can receive', () => {
    render(
      <WhistleblowerForm
        data={{ recipients: recipients.slice(0, 2), minimum: 2 }}
        csrfToken="token"
      />
    )

    expect(screen.getByText(/This goes to all 2 people/)).toBeInTheDocument()
    expect(screen.queryByText(/at least three/)).toBeNull()
  })
})
