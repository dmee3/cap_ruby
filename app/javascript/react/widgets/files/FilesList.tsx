import React, { useState, useEffect } from 'react'
import FilesListItem from './FilesListItem'

type FilesListProps = {
  folderId?: string
}

const FilesList = ({
  folderId
}: FilesListProps) => {
  const [files, setFiles] = useState([])

  const sortFiles = array => {
    return array.sort((a, b) => {
      if (a.fileType === 'folder' && b.fileType !== 'folder') {
        return -1
      }
      if (a.fileType !== 'folder' && b.fileType === 'folder') {
        return 1
      }
      return a.name.localeCompare(b.name)
    })
  }

  useEffect(() => {
    fetch(`/api/files/${folderId || ''}`)
      .then(resp => {
        if (resp.ok) {
          return resp.json()
        }
        throw resp
      })
      .then(data => {
        setFiles(sortFiles(data.map(f => ({
          id: f.id,
          name: f.name,
          fileType: f.file_type
        }))))
      })
      .catch(error => {
        console.error(error)
      })
  }, [])

  return (
    <>
      <ul className="divide-y divide-gray-100">
        {files.length === 0 &&
          <div className="px-9 py-4">
            <span className="italic">Nothing Here</span>
          </div>
        }
        {files.map(file => {
          return <li key={file.id}>
            <FilesListItem
              fileType={file.fileType}
              id={file.id}
              name={file.name}
            />
          </li>
        })}
      </ul>
    </>
  )
}

export default FilesList
