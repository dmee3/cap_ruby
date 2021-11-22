import React from 'react'
import { render } from 'react-dom'
import ConflictCalendar from '../../react/widgets/coordinators/ConflictCalendar'

const CoordinatorsHome = () => {
  render(
    <ConflictCalendar
      coordinator={true}
    />,
    document.getElementById('upcoming-conflicts')
  )
}

CoordinatorsHome()
