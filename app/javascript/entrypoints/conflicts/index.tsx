import React from 'react'
import ReactDOM from 'react-dom'

import ConflictTriage from '../../react/widgets/conflicts/ConflictTriage'

// One entrypoint for both /admin/conflicts and /coordinators/conflicts. The
// two it replaces differed by a component name and five URL slugs.
const mount = document.getElementById('conflicts')

if (mount) {
  const basePath = mount.dataset.basePath ?? '/admin/conflicts'
  const ensembles: string[] = JSON.parse(mount.dataset.ensembles || '[]')

  ReactDOM.render(<ConflictTriage basePath={basePath} ensembles={ensembles} />, mount)
}
