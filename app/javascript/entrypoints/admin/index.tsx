import React from 'react'
import { render } from 'react-dom'
import ConflictCalendar from '../../react/widgets/coordinators/ConflictCalendar'
import UpcomingPayments from '../../react/widgets/admin/UpcomingPayments'

const AdminHome = () => {
  render(
    <ConflictCalendar
      coordinator={false}
    />,
    document.getElementById('upcoming-conflicts')
  )

  render(
    <UpcomingPayments />,
    document.getElementById('upcoming-payments')
  )
}

AdminHome()
