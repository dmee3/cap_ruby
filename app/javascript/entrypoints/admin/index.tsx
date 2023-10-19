import React from 'react'
import { render } from 'react-dom'
import ConflictCalendar from '../../react/widgets/coordinators/ConflictCalendar'
import UpcomingPayments from '../../react/widgets/admin/UpcomingPayments'
import Dues from '../../react/widgets/admin/Dues'

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

  const duesElement = document.getElementById('dues')
  render(
    <Dues
      expectedDues={parseFloat(duesElement.dataset.expectedDues)}
      actualDues={parseFloat(duesElement.dataset.actualDues)}
    />,
    duesElement
  )
}

AdminHome()
