import React from 'react'
import ReactDOM from 'react-dom'

import PerformerPicker from '../../react/widgets/fundraiser/PerformerPicker'

const mount = document.getElementById('performer-picker')

if (mount) {
  const performers = JSON.parse(mount.dataset.performers || '[]')

  ReactDOM.render(<PerformerPicker performers={performers} />, mount)
}
