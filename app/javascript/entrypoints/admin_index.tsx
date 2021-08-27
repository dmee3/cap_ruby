import React from 'react'
import { render } from 'react-dom'
import ConflictCalendar from '../react/widgets/conflict_calendar'
import UpcomingPayments from '../react/widgets/upcoming_payments'

const AdminHome = () => {
  render(
    <ConflictCalendar />,
    document.getElementById('upcoming-conflicts')
  )

  render(
    <UpcomingPayments />,
    document.getElementById('upcoming-payments')
  )
}

AdminHome()

export default AdminHome