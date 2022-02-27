import React from 'react'
import { render } from 'react-dom'
import CalendarChooser from '../../../react/widgets/members/CalendarChooser'

const MembersCalendars = () => {
  render(
    <CalendarChooser></CalendarChooser>,
    document.getElementById('calendars')
  )
}

MembersCalendars()
