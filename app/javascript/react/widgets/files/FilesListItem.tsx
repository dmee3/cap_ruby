import React, { useState } from 'react'
import { ChevronDownIcon, ChevronRightIcon } from '@heroicons/react/24/outline'
import FilesList from './FilesList'
import { typeChip, isFolder } from './fileType'

type FilesListItemProps = {
  fileType: string
  id: string
  name: string
}

const Chip = ({ label }: { label: string }) => (
  <span
    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-sm bg-sunken text-caption font-bold text-secondary"
    aria-hidden="true"
  >
    {label}
  </span>
)

const FilesListItem = ({ fileType, id, name }: FilesListItemProps) => {
  const [expanded, setExpanded] = useState(false)

  if (isFolder(fileType)) {
    return (
      <>
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          aria-expanded={expanded}
          className="flex w-full flex-row items-center gap-3 px-2 py-4 text-left transition hover:bg-sunken"
        >
          {expanded ? (
            <ChevronDownIcon className="h-5 w-5 shrink-0 text-secondary" />
          ) : (
            <ChevronRightIcon className="h-5 w-5 shrink-0 text-secondary" />
          )}
          <Chip label="DIR" />
          <span className="text-body-sm font-medium text-primary">{name}</span>
        </button>
        {expanded && (
          <div className="ml-6">
            <FilesList folderId={id} expanded={expanded} />
          </div>
        )}
      </>
    )
  }

  return (
    <a
      target="_blank"
      rel="noopener noreferrer"
      href={`https://drive.google.com/file/d/${id}/view`}
      className="flex flex-row items-center gap-3 px-2 py-4 pl-9 transition hover:bg-sunken"
    >
      <Chip label={typeChip(fileType, name)} />
      <span className="text-body-sm text-primary">{name}</span>
      {/* "Open", not "Open in Drive" — where the bytes live is ours to know. */}
      <span className="ml-auto text-body-sm text-accent-primary">Open</span>
    </a>
  )
}

export default FilesListItem
