import React, { useState, useEffect } from 'react'
import '@fullcalendar/react/dist/vdom' // solves problem with Vite
import FullCalendar, { ViewApi } from '@fullcalendar/react' // must go before plugins
import dayGridPlugin from '@fullcalendar/daygrid'
import listPlugin from '@fullcalendar/list'
import statusColor from '../../../utilities/status_color'

type ConflictCalendarProps = {
  coordinator: boolean
}

const ConflictCalendar = ({
  coordinator
}: ConflictCalendarProps) => {
  const [conflicts, setConflicts] = useState([])
  const isMobile = window.innerWidth < 768

  const displayTooltip = arg => {
    // Only show tooltips on grid view
    if (arg.view.type !== 'dayGridMonth') {
      return
    }

    const reason = arg.event.extendedProps.reason
    const div = document.createElement('div')
    div.id = `conflict-${arg.event.id}-tooltip`
    div.classList.add(
      'block', 'absolute', 'bottom-8', 'z-10', 'py-2', 'px-3', 'text-sm', 'bg-gray-200', 'dark:bg-gray-600', 'rounded-lg', 'shadow-sm', 'w-80', 'break-normal', 'whitespace-normal'
    )
    div.textContent = reason

    arg.el.prepend(div)
  }

  useEffect(() => {
    const urlSlug = coordinator ? 'coordinators' : 'admin'
    fetch(`/api/${urlSlug}/conflicts`)
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
            c.url = `/${urlSlug}/conflicts/${c.id}/edit`
            c.extendedProps = { reason: c.reason }
            return c
          })
        )
      })
      .catch(error => {
        console.error(error)
      })
  }, [])

  // Conditionally configure views based on screen size
  const plugins = [dayGridPlugin, listPlugin]
  const initialView = isMobile ? 'listWeek' : 'dayGridMonth'
  const headerToolbar = isMobile
    ? {
      start: 'title',
      center: '',
      end: 'prev,today,next',
    }
    : {
      start: 'title',
      center: '',
      end: 'dayGridMonth,listWeek prev,today,next',
    }

  return (
    <>
      <FullCalendar
        events={conflicts}
        eventMouseEnter={(arg) => displayTooltip(arg)}
        eventMouseLeave={(arg) => {
          document.getElementById(`conflict-${arg.event.id}-tooltip`)?.remove()
        }}
        headerToolbar={headerToolbar}
        initialView={initialView}
        plugins={plugins}
        themeSystem={'standard'}
      />
    </>
  )
}

export default ConflictCalendar
