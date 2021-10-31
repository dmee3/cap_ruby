import React from 'react'
import { render } from 'react-dom'
import ConflictCalendar from '../../react/widgets/admin/ConflictCalendar'
import UpcomingPayments from '../../react/widgets/admin/UpcomingPayments'

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
