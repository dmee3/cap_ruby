import React from 'react'
import ReactDOM from 'react-dom'

import ConflictForm from '../../react/widgets/members/ConflictForm'

// The coordinator/admin conflict form. Same component as the member form with
// the triage-only fields switched on, replacing the two byte-identical
// _form.html.erb partials and their 5-column grid.
declare global {
  interface Window {
    conflictTriageForm?: {
      formAction: string
      authenticityToken: string
      defaults: Record<string, string>
      errors: { field: 'start_date' | 'end_date' | 'reason'; message: string }[]
      members: { id: number; name: string }[]
      statuses: { id: number; name: string }[]
      method: 'post' | 'patch'
      submitLabel: string
      cancelHref: string
    }
  }
}

const mount = document.getElementById('conflict-form')
const props = window.conflictTriageForm

if (mount && props) {
  ReactDOM.render(
    <ConflictForm
      formAction={props.formAction}
      authenticityToken={props.authenticityToken}
      defaults={props.defaults}
      errors={props.errors}
      members={props.members}
      statuses={props.statuses}
      method={props.method}
      submitLabel={props.submitLabel}
      cancelHref={props.cancelHref}
      showApprovalNote={false}
    />,
    mount
  )
}
