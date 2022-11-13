import React, { useState } from "react"
import InputNumber from "../../components/inputs/InputNumber"
import InputSelect from "../../components/inputs/InputSelect"

const RhythmConverter = () => {
  const [originalTempo, setOriginalTempo] = useState(120)
  const [originalRhythm, setOriginalRhythm] = useState(12)
  const [convertedTempo, setConvertedTempo] = useState(60)
  const [convertedRhythm, setConvertedRhythm] = useState(24)

  const rhythms = [
    { text: 'Whole Note', value: 3 },
    { text: 'Half Note', value: 6 },
    { text: 'Dotted Quarter Note', value: 8 },
    { text: 'Half Note Triplet', value: 9 },
    { text: 'Quarter Note', value: 12 },
    { text: 'Quarter Note Fivelet', value: 15 },
    { text: 'Dotted Eighth Note', value: 16 },
    { text: 'Quarter Note Triplet', value: 18 },
    { text: 'Eighth Note', value: 24 },
    { text: 'Eighth Note Fivelet', value: 30 },
    { text: 'Eighth Note Triplet', value: 36 },
    { text: 'Sixteenth Note', value: 48 },
    { text: 'Sixteenth Note Fivelet', value: 60 },
    { text: 'Sixteenth Note Triplet', value: 72 },
  ]

  const findRhythmByValue = (value) => {
    return rhythms.filter(r => r.value === value)[0]
  }

  const findRhythmByText = (text) => {
    return rhythms.filter(r => r.text === text)[0]
  }

  const calculateNewConvertedTempo = (ot, or, cr) => {
    const newConvertedTempoValue = ot * (or / cr)
    setConvertedTempo(newConvertedTempoValue)
  }

  const updateOriginalRhythm = (newText) => {
    const newOriginalRhythm = findRhythmByText(newText).value
    setOriginalRhythm(newOriginalRhythm)
    calculateNewConvertedTempo(originalTempo, newOriginalRhythm, convertedRhythm)
  }

  const updateOriginalTempo = (newValue) => {
    setOriginalTempo(newValue)
    calculateNewConvertedTempo(newValue, originalRhythm, convertedRhythm)
  }

  const updateConvertedRhythm = (newText) => {
    const newConvertedRhythm = findRhythmByText(newText).value
    setConvertedRhythm(newConvertedRhythm)
    calculateNewConvertedTempo(originalTempo, originalRhythm, newConvertedRhythm)
  }

  return (
    <div className="flex flex-col">
      <div className="flex flex-row items-center justify-between mt-4 mb-2">
        <h1 className="my-0">Rhythm Converter</h1>
      </div>
      <div className="grid grid-cols-6 gap-x-6 gap-y-4">
        <div className="col-span-6 sm:col-span-1 -mb-2 sm:mb-0 flex items-center">
          <label htmlFor="original_rhythm" className="input-label">Original Rhythm</label>
        </div>
        <div className="col-span-6 sm:col-span-2 flex items-center">
          <InputSelect
            name="original_rhythm"
            onChange={evt => updateOriginalRhythm(evt)}
            options={rhythms.map(r => r.text)}
            value={findRhythmByValue(originalRhythm).text}
          />
        </div>

        <div className="col-span-6 sm:col-span-1 -mb-2 sm:mb-0 flex items-center">
          <label htmlFor="converted_rhythm" className="input-label">Converted Rhythm</label>
        </div>
        <div className="col-span-6 sm:col-span-2 flex items-center">
          <InputSelect
            name="converted_rhythm"
            onChange={evt => updateConvertedRhythm(evt)}
            options={rhythms.map(r => r.text)}
            value={findRhythmByValue(convertedRhythm).text}
          />
        </div>

        <div className="col-span-6 sm:col-span-1 -mb-2 sm:mb-0 flex items-center">
          <label htmlFor="original_tempo" className="input-label">Original Tempo</label>
        </div>
        <div className="col-span-6 sm:col-span-2 -mb-2 sm:mb-0 flex items-center">
          <div className="w-30">
            <InputNumber
              autofocus={true}
              name='original_tempo'
              value={originalTempo}
              onChange={evt => updateOriginalTempo(parseInt(evt.target.value))}
            />
          </div>
          <div className="ml-12">bpm</div>
        </div>

        <div className="col-span-6 sm:col-span-1 -mb-2 sm:mb-0 flex items-center">
          <label htmlFor="original_tempo" className="input-label">Original Tempo</label>
        </div>
        <div className="col-span-6 sm:col-span-2 -mb-2 sm:mb-0 flex items-center">
          <h3>{convertedTempo} bpm</h3>
        </div>
      </div>
    </div>
  )
}

export default RhythmConverter
