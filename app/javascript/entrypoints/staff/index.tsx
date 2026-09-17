import React from 'react'
import ReactDOM from 'react-dom'

import StaffConflicts from '../../react/widgets/staff/StaffConflicts'

const mount = document.getElementById('staff-conflicts')

if (mount) {
  const groups = JSON.parse(mount.dataset.groups || '[]')

  ReactDOM.render(
    <StaffConflicts
      groups={groups}
      outCount={Number(mount.dataset.outCount || 0)}
      windowLabel={mount.dataset.windowLabel || ''}
    />,
    mount
  )
}
