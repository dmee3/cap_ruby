import React from 'react'
import { render } from 'react-dom'
import ConflictForm from '../../../react/widgets/members/ConflictForm'
import MemberConflictList, { ConflictListItem } from '../../../react/widgets/members/MemberConflictList'

declare global {
  var conflictForm:
    | {
        formAction: string
        authenticityToken: string
        /** Set on the new-conflict form only; an edit keeps whatever dates the row already has. */
        minDate?: string
        defaults: Record<string, string | undefined>
        errors: { field: 'start_date' | 'end_date' | 'reason'; message: string }[]
        cancelHref?: string
        method?: 'post' | 'patch'
        submitLabel?: string
      }
    | undefined
  var conflictList: ConflictListItem[] | undefined
  /** Card header for the list, when the screen renders it as a list card. */
  var conflictListCard: { title: string; count?: string } | undefined
}

const formEl = document.getElementById('conflict-form')
if (formEl && window.conflictForm) {
  const cfg = window.conflictForm
  render(
    <ConflictForm
      formAction={cfg.formAction}
      authenticityToken={cfg.authenticityToken}
      minDate={cfg.minDate}
      defaults={cfg.defaults}
      errors={cfg.errors}
      cancelHref={cfg.cancelHref}
      method={cfg.method}
      submitLabel={cfg.submitLabel}
    />,
    formEl
  )
}

const listEl = document.getElementById('conflict-list')
if (listEl) {
  render(
    <MemberConflictList
      conflicts={window.conflictList || []}
      emptyTitle="Nothing submitted yet"
      emptyBody="This is where the conflicts you send will show up."
      showEditLinks
      cardTitle={window.conflictListCard?.title}
      cardCount={window.conflictListCard?.count}
    />,
    listEl
  )
}
