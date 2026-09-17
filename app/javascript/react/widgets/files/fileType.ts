// The API labels four MIME types with a symbol and passes everything else
// through raw, so the chip has to read both shapes.
const KNOWN: Record<string, string> = {
  document: 'DOC',
  pdf: 'PDF',
  audio: 'AUD',
  folder: 'DIR'
}

const MIME: Record<string, string> = {
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'XLS',
  'application/vnd.ms-excel': 'XLS',
  'application/vnd.google-apps.spreadsheet': 'XLS',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'DOC',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'PPT',
  'application/vnd.google-apps.presentation': 'PPT',
  'application/zip': 'ZIP',
  'text/plain': 'TXT'
}

export const typeChip = (fileType: string, name?: string): string => {
  if (KNOWN[fileType]) return KNOWN[fileType]
  if (MIME[fileType]) return MIME[fileType]

  if (fileType.startsWith('image/')) return 'IMG'
  if (fileType.startsWith('video/')) return 'VID'
  if (fileType.startsWith('audio/')) return 'AUD'

  // Falling back to the extension keeps the chip meaningful for a type nobody
  // has mapped yet, which is most of them.
  const extension = name?.split('.').pop()
  if (extension && extension.length <= 4 && extension !== name) {
    return extension.toUpperCase().slice(0, 3)
  }

  return 'FILE'
}

export const isFolder = (fileType: string) => fileType === 'folder'
