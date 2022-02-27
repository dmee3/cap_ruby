import React, { useState } from 'react'

type CalendarChooserProps = {}

const CalendarChooser = ({
}: CalendarChooserProps) => {

  const [chosenImg, setChosenImg] = useState(null)

  const images = [
    'cc2_1', 'cc2_2', 'cc2_3', 'cc2_4', 'cc2_5',
    'cc2_6', 'cc2_7', 'cc2_8', 'cc2_9', 'cc2_10',
    'cc2_11', 'cc2_12', 'cc2_13', 'cc2_14', 'world_1',
    'world_2', 'world_3', 'world_4', 'world_5', 'world_6',
    'world_7', 'world_8', 'world_9', 'world_10', 'world_11'
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
      <div className="card-title text-gray-700 mb-2">DOWNLOAD IMAGE</div>
      <span className="text-secondary">Choose Base Image:</span>
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