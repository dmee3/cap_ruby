import React from 'react'
import { render } from 'react-dom'
import FilesList from '../../react/widgets/files/FilesList'

const Files = () => {
  render(
    <div className="flex flex-col">
      <h1>Files</h1>
      <FilesList
        expanded={true}
      />
    </div>,
    document.getElementById('files')
  )
}

Files()
