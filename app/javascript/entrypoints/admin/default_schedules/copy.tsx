import React from 'react'
import { render } from 'react-dom'
import CopyDefaults, { CopyDefaultsData } from '../../../react/widgets/admin/defaultSchedules/CopyDefaults'

const el = document.getElementById('default-schedules-copy')

if (el && el.dataset.copy) {
  try {
    const data = JSON.parse(el.dataset.copy) as CopyDefaultsData
    render(<CopyDefaults data={data} />, el)
  } catch (e) {
    console.error('Copy defaults failed to parse', e)
    el.innerHTML =
      '<p class="rounded-md border border-border-default bg-surface p-5 text-body-sm text-secondary">' +
      "We couldn't load this page. Refresh, or try again in a minute.</p>"
  }
}
