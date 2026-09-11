import React from 'react'
import ReactDOM from 'react-dom'

import TriageDashboard from '../../react/widgets/coordinators/TriageDashboard'

const mount = document.getElementById('triage-dashboard')

if (mount) {
  const rows = JSON.parse(mount.dataset.rows || '[]')
  const statuses = JSON.parse(mount.dataset.statuses || '[]')
  const pendingCount = Number(mount.dataset.pendingCount || 0)
  const oldestWaitingDays = mount.dataset.oldestWaitingDays
    ? Number(mount.dataset.oldestWaitingDays)
    : null

  ReactDOM.render(
    <TriageDashboard
      rows={rows}
      statuses={statuses}
      pendingCount={pendingCount}
      oldestWaitingDays={oldestWaitingDays}
      oldestMember={mount.dataset.oldestMember || undefined}
      queuePath="/coordinators/conflicts"
      newPath="/coordinators/conflicts/new"
    />,
    mount
  )
}
