import React, { useState, useEffect, useCallback } from 'react'
import FilesListItem from './FilesListItem'
import { isFolder } from './fileType'

export type DriveFile = {
  id: string
  name: string
  fileType: string
}

type FilesListProps = {
  folderId?: string
  expanded: boolean
  /** The season the list is scoped to, for the empty state's sentence. */
  seasonLabel?: string
}

type Status = 'loading' | 'ready' | 'error' | 'unconfigured'

const sortFiles = (files: DriveFile[]) =>
  [...files].sort((a, b) => {
    if (isFolder(a.fileType) && !isFolder(b.fileType)) return -1
    if (!isFolder(a.fileType) && isFolder(b.fileType)) return 1
    return a.name.localeCompare(b.name)
  })

const SkeletonRow = () => (
  <li className="flex items-center gap-3 px-2 py-4">
    <div className="h-8 w-8 animate-pulse rounded-sm bg-sunken" />
    <div className="h-4 w-48 animate-pulse rounded-sm bg-sunken" />
  </li>
)

const FilesList = ({ folderId, expanded, seasonLabel }: FilesListProps) => {
  const [files, setFiles] = useState<DriveFile[]>([])
  const [status, setStatus] = useState<Status>('loading')

  const load = useCallback(() => {
    setStatus('loading')

    fetch(`/api/files/${folderId || ''}`)
      .then(resp => {
        if (resp.ok) return resp.json()
        // A season with no folder set up is somebody's configuration to fix,
        // not a failure to retry, so it gets its own sentence.
        if (resp.status === 404) throw new Error('unconfigured')
        throw new Error('unavailable')
      })
      .then((data: { id: string; name: string; file_type: string }[]) => {
        setFiles(
          sortFiles(data.map(f => ({ id: f.id, name: f.name, fileType: f.file_type })))
        )
        setStatus('ready')
      })
      .catch((error: Error) => {
        // The old handler only logged, and never cleared loading, so a failed
        // fetch left the skeleton shimmering for as long as the tab was open.
        setStatus(error.message === 'unconfigured' ? 'unconfigured' : 'error')
      })
  }, [folderId])

  useEffect(() => {
    if (!expanded) return
    load()
  }, [expanded, load])

  if (status === 'loading') {
    return (
      <ul className="divide-y divide-border-default">
        <SkeletonRow />
        <SkeletonRow />
        <SkeletonRow />
      </ul>
    )
  }

  if (status === 'error') {
    return (
      <div className="rounded-md border border-border-default bg-surface p-5">
        <h2 className="mt-0 mb-1 text-body font-bold">Can't load</h2>
        <p className="m-0 mb-3 text-body-sm text-secondary">
          We couldn't load your files. Try again in a moment. If it keeps failing, tell an admin.
        </p>
        <button type="button" onClick={load} className="btn-gray btn-md">
          Try again
        </button>
      </div>
    )
  }

  if (status === 'unconfigured') {
    return (
      <div className="rounded-md border border-border-default bg-surface p-5">
        <p className="m-0 text-body-sm text-secondary">
          {seasonLabel
            ? `No files have been set up for ${seasonLabel} yet.`
            : 'No files have been set up for this season yet.'}{' '}
          An admin needs to connect a folder before anything shows up here.
        </p>
      </div>
    )
  }

  if (files.length === 0) {
    return (
      <div className="rounded-md border border-border-default bg-surface p-5">
        <p className="m-0 text-body-sm text-secondary">
          {seasonLabel ? `Nothing here for ${seasonLabel} yet.` : 'Nothing here yet.'}{' '}
          Music, drill, and other files will show up once the staff uploads them.
        </p>
      </div>
    )
  }

  return (
    <ul className="divide-y divide-border-default">
      {files.map(file => (
        <li key={file.id}>
          <FilesListItem fileType={file.fileType} id={file.id} name={file.name} />
        </li>
      ))}
    </ul>
  )
}

export default FilesList
