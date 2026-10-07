import React from 'react'
import { render } from 'react-dom'
import MoveDates from '../../../react/widgets/admin/defaultSchedules/MoveDates'
import { Overview } from '../../../react/widgets/admin/defaultSchedules/shared'

const el = document.getElementById('default-schedule-dates')

if (el && el.dataset.overview) {
  try {
    const data = JSON.parse(el.dataset.overview) as Overview
    render(<MoveDates data={data} />, el)
  } catch (e) {
    console.error('Move dates failed to parse', e)
    el.innerHTML =
      '<p class="rounded-md border border-border-default bg-surface p-5 text-body-sm text-secondary">' +
      "We couldn't load the dates. Refresh, or try again in a minute.</p>"
  }
}
