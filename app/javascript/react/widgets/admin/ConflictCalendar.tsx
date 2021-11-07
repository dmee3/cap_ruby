import React, { useState, useEffect } from 'react'
import '@fullcalendar/react/dist/vdom' // solves problem with Vite
import FullCalendar from '@fullcalendar/react' // must go before plugins
import dayGridPlugin from '@fullcalendar/daygrid'
import listPlugin from '@fullcalendar/list'
import statusColor from '../../../utilities/status_color'

type ConflictCalendarProps = {
}

const ConflictCalendar = ({
}: ConflictCalendarProps) => {
  const [conflicts, setConflicts] = useState([])

  useEffect(() => {
    fetch('/api/admin/conflicts')
      .then(resp => {
        if (resp.ok) {
          return resp.json()
        }
        throw resp
      })
      .then(data => {
        setConflicts(data
          .filter(c => c.status.name !== 'Denied' && c.status.name !== 'Resolved')
          .map(c => {
            const color = statusColor(c.status.name)
            c.backgroundColor = color
            c.borderColor = color
            c.url = `/admin/conflicts/${c.id}/edit`
            c.extendedProps = { reason: c.reason }
            return c
          })
        )
      })
      .catch(error => {
        console.error(error)
      })
  }, [])

  return (
    <>
      <FullCalendar
        events={conflicts}
        headerToolbar={{
          start: 'title',
          center: '',
          end: 'dayGridMonth,listWeek prev,today,next',
        }}
        initialView="dayGridMonth"
        plugins={[dayGridPlugin, listPlugin]}
        themeSystem={'standard'}
      />
    </>
  )
}

export default ConflictCalendar