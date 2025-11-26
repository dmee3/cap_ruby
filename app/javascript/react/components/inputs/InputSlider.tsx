import React from 'react'

type InputSliderProps = {
  id: string
  name: string
  min: number
  max: number
  step: number
  value: number
  onChange: (value: number) => void
  label?: string
}

const InputSlider = ({
  id,
  name,
  min,
  max,
  step,
  value,
  onChange,
  label
}: InputSliderProps) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(Number(e.target.value))
  }

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={id} className="input-label mb-2 flex justify-between">
          <span>{label}</span>
          <span className="text-ocean font-semibold">{value}</span>
        </label>
      )}
      <input
        type="range"
        id={id}
        name={name}
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={handleChange}
        className="w-full h-2 bg-gray-100 dark:bg-gray-800 rounded-lg appearance-none cursor-pointer slider"
        style={{
          background: `linear-gradient(to right, #386374 0%, #386374 ${((value - min) / (max - min)) * 100}%, #e5e7eb ${((value - min) / (max - min)) * 100}%, #e5e7eb 100%)`
        }}
      />
      <style>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: #386374;
          cursor: pointer;
          border: 2px solid white;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        }

        .slider::-webkit-slider-thumb:hover {
          background: #498197;
        }

        .slider::-moz-range-thumb {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: #386374;
          cursor: pointer;
          border: 2px solid white;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        }

        .slider::-moz-range-thumb:hover {
          background: #498197;
        }
      `}</style>
    </div>
  )
}

export default InputSlider
