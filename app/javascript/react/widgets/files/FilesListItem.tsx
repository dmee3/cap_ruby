import React, { useState } from 'react'
import {
  ChevronDownIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline'
import {
  DocumentIcon,
  FolderIcon,
  SpeakerWaveIcon
} from '@heroicons/react/20/solid'
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
  let icon, color = 'text-gray-700 dark:text-gray-300'

  const toggleExpanded = () => {
    setExpanded(!expanded)
  }

  switch (fileType) {
    case 'audio':
      icon = <SpeakerWaveIcon className="h-6 w-6" />
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
      color = ''
      break
    default:
      icon = <DocumentIcon className="h-6 w-6" />
      break
  }

  if (fileType === 'folder') {
    return (
      <>
        <div className="px-2 py-4 flex flex-col hover:bg-gray-100 dark:hover:bg-gray-800 transition cursor-pointer sticky" onClick={toggleExpanded}>
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
      <a target="_blank" href={`https://drive.google.com/file/d/${id}/view`} className={`pl-9 py-4 flex flex-col hover:bg-gray-100 dark:hover:bg-gray-800 ${color} transition`}>
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
