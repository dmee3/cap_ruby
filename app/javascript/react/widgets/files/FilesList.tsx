import React, { useState, useEffect } from 'react'
import FilesListItem from './FilesListItem'

type FilesListProps = {
  folderId?: string,
  expanded: boolean,
}

const FilesList = ({
  folderId,
  expanded
}: FilesListProps) => {
  const [files, setFiles] = useState([])
  const [loading, setLoading] = useState(true)

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
    if (!expanded || files.length > 0) { return }

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
        setLoading(false)
      })
      .catch(error => {
        console.error(error)
      })
  }, [expanded])

  return (
    <>
      {loading &&
        <ul className="divide-y divide-gray-300">
          <li className="pl-9 py-4 flex flex-col">
            <div className="flex justify-start">
              <div className="rounded-full bg-gray-300 h-6 w-6 animate-pulse"></div>
              <div className="ml-2 w-48 bg-gray-300 rounded animate-pulse"></div>
            </div>
          </li>
          <li className="pl-9 py-4 flex flex-col">
            <div className="flex justify-start">
              <div className="rounded-full bg-gray-300 h-6 w-6 animate-pulse"></div>
              <div className="ml-2 w-48 bg-gray-300 rounded animate-pulse"></div>
            </div>
          </li>
        </ul>
      }
      {files.length === 0 && !loading &&
        <div className="px-9 py-4">
          <span className="italic">Nothing Here</span>
        </div>
      }
      <ul className="divide-y divide-gray-300">
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
