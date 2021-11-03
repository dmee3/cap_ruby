import React, { useState } from 'react'
import {
  ChevronDownIcon,
  ChevronRightIcon,
  DocumentIcon,
  FolderIcon,
  VolumeUpIcon
} from '@heroicons/react/outline'
import FilesList from './FilesList'

type FilesListItemProps = {
  fileType: string,
  id: string,
  name: string
}

const FilesListItem = ({
  fileType,
  id,
  name
}: FilesListItemProps) => {
  const [expanded, setExpanded] = useState(false)
  let icon

  const toggleExpanded = () => {
    setExpanded(!expanded)
  }

  switch (fileType) {
    case 'audio':
      icon = <VolumeUpIcon className="h-6 w-6" />
      break
    case 'document':
    case 'pdf':
      icon = <DocumentIcon className="h-6 w-6" />
      break
    case 'folder':
      icon = <>
        {expanded && <ChevronDownIcon className="h-6 w-6" />}
        {!expanded && <ChevronRightIcon className="h-6 w-6" />}
        <FolderIcon className="ml-1 h-6 w-6" />
      </>
      break
    default:
      icon = <DocumentIcon className="h-6 w-6" />
      break
  }

  if (fileType === 'folder') {
    return (
      <>
        <div className="px-2 py-4 flex flex-col hover:bg-gray-100 transition cursor-pointer" onClick={toggleExpanded}>
          <div className="flex justify-start">
            {icon}
            <span className="font-medium ml-2">
              {name}
            </span>
          </div>
        </div>
        <div className={`ml-6 ${expanded ? 'block' : 'hidden'}`}>
          <FilesList
            folderId={id}
            expanded={expanded}
          />
        </div>
      </>
    )
  } else {
    return (
      <a target="_blank" href={`https://drive.google.com/file/d/${id}/view`} className="pl-9 py-4 flex flex-col hover:bg-gray-100 transition">
        <div className="flex justify-start">
          {icon}
          <span className="font-light ml-2">
            {name}
          </span>
        </div>
      </a>
    )
  }
}

export default FilesListItem
