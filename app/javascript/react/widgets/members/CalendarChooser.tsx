import React, { useEffect, useState } from 'react'
import FileUpload from './FileUpload'

type CalendarChooserProps = {}

const CalendarChooser = ({
}: CalendarChooserProps) => {
  const logoSrc = '/images/calendars/logo.png'
  const [chosenImg, setChosenImg] = useState(null)
  const [donations, setDonations] = useState([])

  const rows = [403, 469, 535, 601, 667, 733]
  const cols = [199, 303, 407, 511, 615, 719, 823]

  const dateCoordinates = [
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
    [cols[1], rows[5]],
  ]

  const images = [
    'calendar_1', 'calendar_2', 'calendar_3', 'calendar_4', 'calendar_5', 'calendar_6',
    'calendar_7', 'calendar_8', 'calendar_9', 'calendar_10'
  ]

  const fetchDonations = () => {
    useEffect(() => {
      fetch("/api/members/calendars")
        .then(resp => {
          if (resp.ok) {
            return resp.json()
          }
          throw resp
        })
        .then(data => {
          setDonations(data.dates)
        })
        .catch(error => {
          console.error(error)
        })
    }, [])
  }

  const loadImage = (path): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.onload = () => resolve(img)
      img.onerror = () => reject('Error loading image')
      img.src = path
    })
  }

  const pickImg = (img) => {
    setChosenImg(img)
    const allImages = document.getElementsByClassName("thumbnail")
    Array.from(allImages).forEach(ele => {
      ele.classList.remove('ring-4')
    });
    document.getElementById(`${img}-thumb`).classList.add('ring-4')
  }

  const download = () => {
    if (!chosenImg) return

    const canvas = document.createElement('canvas')
    canvas.width = 1080
    canvas.height = 1080
    Promise
      .all([loadImage(`/images/calendars/${chosenImg}.png`), loadImage(logoSrc)])
      .then(([img, logo]) => {
        const ctx = canvas.getContext('2d')
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
        applyLogos(logo, canvas, ctx)
        const link = document.createElement('a')
        link.download = 'calendar-fundraiser.png'
        link.href = canvas.toDataURL()
        link.click()
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

  fetchDonations()

  return (
    <div className="flex flex-col">
      <div className="card-title text-gray-700 dark:text-gray-300 mb-2">DOWNLOAD IMAGE</div>
      <div className="my-4 text-secondary dark:text-gray-400">
        <div className="flex flex-col">
          <span>Option 1: Custom Image</span>
          <div className="flex flex-col text-xs">
            <span>Upload your own image and get the calendar overlaid on top of it. A square image at least 1080px large is recommended, but the tool can do a bit of basic scaling. It will always start drawing the image from the top left corner, so for example if your image is wider than it is tall, the right side will get cut off.</span>
            <br />
            <span>If the image doesn't render properly at first, try moving the dimming slider a bit to refresh it.</span>
            <br />
            <span>If all else fails and the tool isn't working, Slack me with the image you want to use and I'll get it uploaded and added to the pre-made section below.</span>
            <br />
            <div className="text-right"><span>- Dan</span></div>
          </div>
        </div>
      </div>
      <FileUpload donations={donations} />
      <div className="mt-4 text-secondary dark:text-gray-400">
        <span className="">Option 2: Premade Image</span>
        <div className="grid grid-cols-5 gap-4">
          {images.map(img => {
            return <div key={img}>
              <img
                className="thumbnail rounded-md transition"
                id={`${img}-thumb`}
                src={`/images/calendars/${img}_thumb.jpg`}
                onClick={() => pickImg(img)}
              />
            </div>
          })}
        </div>
      </div>

      <button
        className="btn-primary btn-lg mt-4"
        disabled={chosenImg === null}
        onClick={() => download()}
      >
        DOWNLOAD
      </button>
    </div>
  )
}

export default CalendarChooser
