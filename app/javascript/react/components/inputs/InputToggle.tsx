import * as React from 'react'

type InputToggleProps = {
  checked: boolean,
  id: string,
  name: string,
  onChange: any,
  text: string
}
const InputToggle = ({
  checked,
  id,
  name,
  onChange,
  text
}: InputToggleProps) => {
  return (
    <label className="input-toggle-wrapper" htmlFor={id}>
      <input name={name} type="hidden" value="0"></input>
      <input className="input-toggle" type="checkbox" checked={checked} name={name} id={id} onChange={e => onChange(e.target.checked)} />
      <div className="input-toggle-bg input-toggle-bg"></div>
      <div className="input-toggle-dot"></div>
      <div className="ml-3 input-label">
        {text}
      </div>
    </label>
  )
}

export default InputToggle