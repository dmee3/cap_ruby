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
  }
}
