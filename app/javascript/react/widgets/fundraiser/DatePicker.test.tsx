import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect } from 'vitest'
import DatePicker from './DatePicker'
import { Performer } from '../../components/PerformerCard'

const performer: Performer = {
  token: 'tok1',
  name: 'Elena Sokol',
  initials: 'ES',
  ensemble: 'World',
  section: 'Front Ensemble',
  raised_cents: 31_200,
  goal_cents: 49_600,
  claimed_count: 18,
  total_dates: 31,
  complete: false,
}

const setup = (claimed: number[] = []) =>
  render(
    <DatePicker performer={performer} claimedDates={claimed} checkoutPath="/fundraiser/tok1/checkout" />,
  )

describe('DatePicker', () => {
  it('tells the donor the rule up front', () => {
    setup()

    expect(screen.getByText('Tap a date, donate that many dollars')).toBeInTheDocument()
  })

  it('totals what has been picked', async () => {
    setup()

    await userEvent.click(screen.getByRole('button', { name: /Sponsor the 3rd/ }))
    await userEvent.click(screen.getByRole('button', { name: /Sponsor the 17th/ }))

    // 3 + 17, in the rail and the sticky bar.
    expect(screen.getAllByText('$20').length).toBeGreaterThan(0)
    expect(screen.getByText('2 dates')).toBeInTheDocument()
  })

  it('takes a date back off when its tile is tapped again', async () => {
    setup()

    const tile = screen.getByRole('button', { name: /Sponsor the 9th/ })
    await userEvent.click(tile)
    expect(screen.getByText('1 date')).toBeInTheDocument()

    await userEvent.click(tile)
    expect(screen.getByText('0 dates')).toBeInTheDocument()
  })

  // Mobile has no chip ✕, so the instruction has to say this outright.
  it('says how to remove a date, since mobile has no other affordance', () => {
    setup()

    expect(screen.getByText(/Tap a date again to take it off/)).toBeInTheDocument()
  })

  it('removes a date from the desktop rail chip', async () => {
    setup()

    await userEvent.click(screen.getByRole('button', { name: /Sponsor the 5th/ }))
    await userEvent.click(screen.getByRole('button', { name: 'Remove the 5th' }))

    expect(screen.getByText('0 dates')).toBeInTheDocument()
  })

  it('states plainly that no fee is added', async () => {
    setup()

    await userEvent.click(screen.getByRole('button', { name: /Sponsor the 4th/ }))

    expect(screen.getByText(/You'll pay exactly \$4\. No fees added\./)).toBeInTheDocument()
  })

  it('projects where the donation would leave the performer', async () => {
    setup()

    await userEvent.click(screen.getByRole('button', { name: /Sponsor the 20th/ }))

    // $312 raised + $20 = $332 of $496.
    expect(screen.getByText(/\$332 of \$496/)).toBeInTheDocument()
  })

  it('cannot continue with nothing picked', () => {
    setup()

    screen.getAllByRole('button', { name: /Continue/ }).forEach((button) => {
      expect(button).toBeDisabled()
    })
  })

  it('leaves a claimed date untouchable', async () => {
    setup([7])

    const taken = screen.getByRole('button', { name: /7th is already sponsored/i })
    expect(taken).toBeDisabled()

    await userEvent.click(taken)
    expect(screen.getByText('0 dates')).toBeInTheDocument()
  })
})
