import * as React from 'react'
import { render } from 'react-dom'
import ConflictCalendar from '../react/conflict_calendar'

const AdminHome = () => {
  render(
    <ConflictCalendar />,
    document.getElementById('upcoming-conflicts')
  )
}

AdminHome()

export default AdminHome