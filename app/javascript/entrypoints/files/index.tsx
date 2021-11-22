import React from 'react'
import { render } from 'react-dom'
import FilesList from '../../react/widgets/files/FilesList'

const Files = () => {
  render(
    <FilesList
      expanded={true}
    />,
    document.getElementById('files')
  )
}

Files()
