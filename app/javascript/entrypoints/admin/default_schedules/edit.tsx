import React from 'react'
import { render } from 'react-dom'
import EditDefault, { EditDefaultData } from '../../../react/widgets/admin/defaultSchedules/EditDefault'

const el = document.getElementById('default-schedule-editor')

if (el && el.dataset.editor) {
  try {
    const data = JSON.parse(el.dataset.editor) as EditDefaultData
    render(<EditDefault data={data} />, el)
  } catch (e) {
    console.error('Default schedule editor failed to parse', e)
    el.innerHTML =
      '<p class="rounded-md border border-border-default bg-surface p-5 text-body-sm text-secondary">' +
      "We couldn't load this default. Refresh, or try again in a minute.</p>"
  }
}
