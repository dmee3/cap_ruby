import React, { useEffect, useState } from 'react'
import InputToggle from '../../components/inputs/InputToggle'
import { XMarkIcon } from '@heroicons/react/24/outline'

type CustomCalendarBuilderProps = {
  imageSrc: string,
  onClose: () => void,
  donations: Array<any>
}
const CustomCalendarBuilder = ({ imageSrc, onClose, donations }: CustomCalendarBuilderProps) => {
  const overlaySrc = '/images/calendars/calendar_base.png'
  const darkenSrc = '/images/calendars/darken_layer.png'
  const logoSrc = '/images/calendars/logo.png'

  const rows = [403, 469, 535, 601, 667, 733]
  const cols = [199, 303, 407, 511, 615, 719, 823]

  const dateCoordinates = [
    [cols[5], rows[0]],
    [cols[6], rows[0]],
    [cols[0], rows[1]],
    [cols[1], rows[1]],
    [cols[2], rows[1]],
    [cols[3], rows[1]],
    [cols[4], rows[1]],
    [cols[5], rows[1]],
    [cols[6], rows[1]],
    [cols[0], rows[2]],
    [cols[1], rows[2]],
    [cols[2], rows[2]],
    [cols[3], rows[2]],
    [cols[4], rows[2]],
    [cols[5], rows[2]],
    [cols[6], rows[2]],
    [cols[0], rows[3]],
    [cols[1], rows[3]],
    [cols[2], rows[3]],
    [cols[3], rows[3]],
    [cols[4], rows[3]],
    [cols[5], rows[3]],
    [cols[6], rows[3]],
    [cols[0], rows[4]],
    [cols[1], rows[4]],
    [cols[2], rows[4]],
    [cols[3], rows[4]],
    [cols[4], rows[4]],
    [cols[5], rows[4]],
    [cols[6], rows[4]],
    [cols[0], rows[5]],
  ]

  const [darken, setDarken] = useState(true)

  const toggleDarken = () => {
    resizeCanvas()
    renderCanvas(!darken)
    setDarken(!darken)
  }

  const resizeCanvas = () => {
    const canvas = document.getElementById("calendar-canvas") as HTMLCanvasElement
    const ref = document.getElementById("img-reference")
    canvas.width = ref.clientWidth
    canvas.height = ref.clientWidth // Ensure square canvas
  }

  const loadImage = (path): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.onload = () => resolve(img)
      img.onerror = () => reject('Error loading image')
      img.src = path
    })
  }

  const applyLogos = (logo, canvas, ctx) => {
    donations.forEach(donation => {
      const [x, y] = dateCoordinates[donation.date - 1]
      const scaledX = x * (canvas.width / 1080)
      const scaledY = y * (canvas.height / 1080)
      ctx.drawImage(
        logo,
        scaledX,
        scaledY,
        logo.width * (canvas.width / 1080),
        logo.height * (canvas.height / 1080)
      )
    })
  }

  const draw = (canvas, shouldDarken) => {
    const ctx = canvas.getContext("2d")
    return Promise
      .all([loadImage(imageSrc), loadImage(darkenSrc), loadImage(overlaySrc)])
      .then(([image, darken, overlay]) => {
        // Roughly scale down and appropriately position the image
        const useWidth = image.width < image.height
        const imgScaleFactor = useWidth ? canvas.width / image.width : canvas.height / image.height
        ctx.drawImage(image, 0, 0, image.width * imgScaleFactor, image.height * imgScaleFactor)

        // Add darken layer if necessary
        if (shouldDarken) {
          ctx.drawImage(darken, 0, 0, canvas.width, canvas.height)
        }

        ctx.drawImage(overlay, 0, 0, canvas.width, canvas.height)
      })
      .then(() => {
        return loadImage(logoSrc)
      })
      .then((logo) => {
        applyLogos(logo, canvas, ctx)
      })
      .catch((err) => console.log(err))
  }

  const renderCanvas = (shouldDarken) => {
    const canvas = document.getElementById("calendar-canvas") as HTMLCanvasElement
    draw(canvas, shouldDarken)
  }

  const download = () => {
    const canvas = document.getElementById("download-canvas") as HTMLCanvasElement
    draw(canvas, darken).then(() => {
      const link = document.createElement('a')
      link.download = 'calendar-fundraiser.png'
      link.href = canvas.toDataURL()
      link.click()
    })
  }

  useEffect(() => {
    resizeCanvas()
    renderCanvas(darken)
    console.log('did it!')
  }, [])

  return (
    <div className="fixed top-0 left-0 w-full h-full bg-black bg-opacity-75 z-50 flex justify-center items-center" onClick={onClose}>
      <div className="bg-white p-4 rounded-md relative" onClick={e => e.stopPropagation()}>
        <div id="canvas-container" className="relative">
          <img src={overlaySrc} id="img-reference" alt="Calendar" style={{ zIndex: -1 }} />
          <canvas id="calendar-canvas" width="10" height="10" className="absolute top-0 left-0"></canvas>
          <canvas id="download-canvas" width="1080" height="1080" className="hidden"></canvas>
        </div>

        <div className="flex flex-row mt-4">
          <InputToggle
            checked={darken}
            id='darken-checkbox'
            name='darken-checkbox'
            onChange={() => toggleDarken()}
            text='Darken Background'
          />
        </div>
        <div className="flex flex-row justify-between items-center mt-4">
          <div className="flex-grow">
            <button onClick={download} className="btn-primary btn-lg">Download</button>
          </div>
          <div className="ml-4 self-stretch flex">
            <button onClick={onClose} className="btn-red btn-lg self-stretch"><XMarkIcon className="h-6 w-6" /></button>
          </div>
        </div>
      </div>
    </div >
  )
}

export default CustomCalendarBuilder
