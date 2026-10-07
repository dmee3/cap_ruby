import React from 'react'
import { render } from 'react-dom'
import DefaultSchedulesOverview from '../../../react/widgets/admin/defaultSchedules/DefaultSchedulesOverview'
import { Overview } from '../../../react/widgets/admin/defaultSchedules/shared'

const el = document.getElementById('default-schedules-overview')

if (el && el.dataset.overview) {
  try {
    const data = JSON.parse(el.dataset.overview) as Overview
    render(<DefaultSchedulesOverview data={data} />, el)
  } catch (e) {
    console.error('Default schedules overview failed to parse', e)
    el.innerHTML =
      '<p class="rounded-md border border-border-default bg-surface p-5 text-body-sm text-secondary">' +
      "We couldn't load the default schedules. Refresh, or try again in a minute.</p>"
  }
}
