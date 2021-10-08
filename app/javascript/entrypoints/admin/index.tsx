import React from 'react'
import { render } from 'react-dom'
import ConflictCalendar from '../../react/widgets/ConflictCalendar'
import UpcomingPayments from '../../react/widgets/UpcomingPayments'

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
