import React, { useState } from 'react'

type CalendarChooserProps = {}

const CalendarChooser = ({
}: CalendarChooserProps) => {

  const [chosenImg, setChosenImg] = useState(null)

  const images = [
    'calendar_1', 'calendar_2', 'calendar_3', 'calendar_4', 'calendar_5', 'calendar_6',
    'calendar_7', 'calendar_8', 'calendar_9', 'calendar_10', 'calendar_11', 'calendar_12',
    'calendar_13', 'calendar_14', 'calendar_15', 'calendar_16', 'calendar_17', 'calendar_18',
    'calendar_19', 'calendar_20',
  ]

  const pickImg = (img) => {
    setChosenImg(img)
    const allImages = document.getElementsByClassName("thumbnail")
    Array.from(allImages).forEach(ele => {
      ele.classList.remove('ring-4')
    });
    document.getElementById(`${img}-thumb`).classList.add('ring-4')
  }

  const submitForm = () => {
    if (chosenImg === null) return

    window.location.href = `/members/calendars/download?base_img=${chosenImg}`
  }

  return (
    <div className="flex flex-col">
      <div className="card-title text-gray-700 dark:text-gray-300 mb-2">DOWNLOAD IMAGE</div>
      <span className="text-secondary dark:text-gray-400">Choose Base Image:</span>
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

      <button
        className="btn-primary btn-lg mt-4"
        disabled={chosenImg === null}
        onClick={() => submitForm()}
      >
        DOWNLOAD
      </button>
    </div>
  )
}

export default CalendarChooser