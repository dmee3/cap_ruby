import React from 'react'
import { render } from 'react-dom'
import ScheduleEditor, { ScheduleEditorData } from '../../../react/widgets/admin/ScheduleEditor'

const el = document.getElementById('schedule-editor')

if (el && el.dataset.editor) {
  try {
    const data = JSON.parse(el.dataset.editor) as ScheduleEditorData
    render(<ScheduleEditor data={data} />, el)
  } catch (e) {
    console.error('Schedule editor failed to parse', e)
    el.innerHTML =
      '<p class="rounded-md border border-border-default bg-surface p-5 text-body-sm text-secondary">' +
      "We couldn't load this schedule. Refresh, or try again in a minute.</p>"
  }
}
