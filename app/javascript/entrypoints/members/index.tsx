import React from 'react'
import { render } from 'react-dom'
import DuesMeter, { DuesState } from '../../react/components/DuesMeter'
import DuesTimeline, { TimelineRow } from '../../react/widgets/members/DuesTimeline'
import MemberConflictList, { ConflictListItem } from '../../react/widgets/members/MemberConflictList'

const meterEl = document.getElementById('dues-meter')
if (meterEl) {
  const d = meterEl.dataset
  render(
    <DuesMeter
      paidCents={Number(d.paid)}
      totalCents={Number(d.total)}
      expectedCents={Number(d.expected)}
      committedCents={Number(d.committed || 0)}
      committedKind={(d.committedKind as 'past-due' | 'pending') || 'past-due'}
      state={d.state as DuesState}
    />,
    meterEl
  )
}

const timelineEl = document.getElementById('dues-timeline')
if (timelineEl) {
  const data = JSON.parse(timelineEl.dataset.timeline || '{"paid":[],"upcoming":[]}') as {
    paid: TimelineRow[]
    upcoming: TimelineRow[]
  }
  render(<DuesTimeline paid={data.paid} upcoming={data.upcoming} />, timelineEl)
}

const conflictListEl = document.getElementById('conflict-list')
if (conflictListEl && conflictListEl.dataset.conflicts) {
  const conflicts = JSON.parse(conflictListEl.dataset.conflicts) as ConflictListItem[]
  // Edit links here too: the dashboard card is where a member most often
  // notices a wrong date, and the rows already carry the server's own
  // editable/edit_path decision.
  render(<MemberConflictList conflicts={conflicts} showEditLinks />, conflictListEl)
}
