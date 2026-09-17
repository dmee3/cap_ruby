import React from 'react'
import { render } from 'react-dom'
import FilesList from '../../react/widgets/files/FilesList'

const el = document.getElementById('files')

if (el) {
  const season = el.dataset.season
  render(<FilesList expanded seasonLabel={season ? `the ${season} season` : undefined} />, el)
}
