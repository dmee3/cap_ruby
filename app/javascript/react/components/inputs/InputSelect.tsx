import * as React from 'react'

type InputSelectProps = {
  autofocus?: boolean,
  disabled?: boolean,
  id?: string,
  name: string,
  onChange: any,
  options: Array<string>,
  prompt?: string,
  placeholder?: string,
  value: string
}
const InputSelect = ({
  autofocus = false,
  disabled = false,
  id,
  name,
  onChange,
  options,
  prompt,
  placeholder,
  value
}: InputSelectProps) => {
  return (
    <select
      autoFocus={autofocus}
      className="input-select"
      disabled={disabled}
      id={id}
      name={name}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      value={value}
    >
      {prompt && <option>{prompt}</option>}
      {options.map(option => {
        return <option key={option} value={option}>{option}</option>
      })}
    </select>
  )
}

export default InputSelect