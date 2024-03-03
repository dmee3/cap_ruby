import React, { useState } from 'react'
import Utilities from '../../../utilities/utilities'
import CustomCalendarBuilder from './CustomCalendarBuilder'

type FileUploadProps = { donations: Array<any> }

const FileUpload = ({ donations }: FileUploadProps) => {
  const [previewImageSrc, setPreviewImageSrc] = useState<string>()

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) {
      return
    }

    try {
      setPreviewImageSrc(await Utilities.fileToDataString(file))
    } catch (error) {
      console.error(error)
    }
  }

  const handleCloseClick = () => {
    setPreviewImageSrc(undefined)
  }

  return (
    <>
      {
        previewImageSrc &&
        <CustomCalendarBuilder imageSrc={previewImageSrc} onClose={handleCloseClick} donations={donations} />
      }
      <div className="mb-3">
        <input
          className="input-file-upload"
          type="file"
          onChange={handleFileChange} />
      </div>
    </>
  )
}

export default FileUpload
