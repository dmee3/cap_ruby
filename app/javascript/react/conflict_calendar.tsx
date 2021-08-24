import * as React from 'react'
import '@fullcalendar/react/dist/vdom' // solves problem with Vite
import FullCalendar from '@fullcalendar/react' // must go before plugins
import dayGridPlugin from '@fullcalendar/daygrid'
import listPlugin from '@fullcalendar/list'
import statusColor from '../utilities/status_color'

type ConflictCalendarProps = {
}

const ConflictCalendar = ({
}: ConflictCalendarProps) => {
  const [conflicts, setConflicts] = React.useState([])
  React.useEffect(() => {
    fetch('/admin/api/conflicts')
      .then(resp => {
        if (resp.ok) {
          return resp.json()
        }
        throw resp
      })
      .then(data => {
        data = data.map(c => {
          const color = statusColor(c.status.name)
          c.backgroundColor = color
          c.borderColor = color
          c.url = `/admin/conflicts/${c.id}/edit`
          c.extendedProps = { reason: c.reason }
          return c
        })
        setConflicts(data)
      })
      .catch(error => {
        console.error(`Error setting conflicts: ${error}`)
      })
  }, [])

  return (
    <div>
      <span className="text-sm font-medium text-gray-500">UPCOMING CONFLICTS</span>
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
    </div>
  )
}

export default ConflictCalendar