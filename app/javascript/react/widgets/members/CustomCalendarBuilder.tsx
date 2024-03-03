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

  const [darken, setDarken] = useState(83)

  const changeDarken = async (newVal) => {
    renderCanvas(newVal)
    setDarken(newVal)
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

  const draw = (canvas, darkLevel) => {
    const ctx = canvas.getContext("2d")
    return Promise
      .all([loadImage(imageSrc), loadImage(overlaySrc)])
      .then(([image, overlay]) => {
        // Roughly scale down and appropriately position the image
        const useWidth = image.width < image.height
        const imgScaleFactor = useWidth ? canvas.width / image.width : canvas.height / image.height
        ctx.drawImage(image, 0, 0, image.width * imgScaleFactor, image.height * imgScaleFactor)

        // Add darken layer with appropriate opacity (max 67%)
        ctx.fillStyle = `rgba(0, 0, 0, ${darkLevel / 150})`
        ctx.fillRect(0, 0, canvas.width, canvas.height)

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

  const renderCanvas = (darkLevel) => {
    const canvas = document.getElementById("calendar-canvas") as HTMLCanvasElement
    if (canvas.width == 0 || canvas.height == 0) {
      resizeCanvas()
    }
    draw(canvas, darkLevel)
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
  }, [])

  return (
    <div className="fixed top-0 left-0 w-full h-full bg-black bg-opacity-75 z-50 flex justify-center items-center" onClick={onClose}>
      <div className="bg-white p-4 rounded-md relative" onClick={e => e.stopPropagation()}>
        <div id="canvas-container" className="relative">
          <img src={overlaySrc} id="img-reference" alt="Calendar" style={{ zIndex: -1 }} />
          <canvas id="calendar-canvas" width="10" height="10" className="absolute top-0 left-0"></canvas>
          <canvas id="download-canvas" width="1080" height="1080" className="hidden"></canvas>
        </div>

        <div className="flex flex-col mt-4">
          <span className="text-secondary dark:text-gray-400">Image Dimming Level</span>
          <div className="flex flex-col">
            <input
              id="darken"
              type="range"
              value={darken}
              className=""
              onChange={(evt) => changeDarken(evt.target.value)}
            />
            <div className="flex flex-row justify-between text-xs">
              <span>0%</span>
              <span>33%</span>
              <span>67%</span>
            </div>
          </div>
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
