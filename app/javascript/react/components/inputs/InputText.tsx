import * as React from 'react'

type InputTextProps = {
  autofocus?: boolean,
  id?: string,
  name: string,
  placeholder?: string,
  value?: string
}

const InputText = ({
  autofocus = false,
  id,
  name,
  placeholder,
  value = ''
}: InputTextProps) => {
  const [internalValue, setValue] = React.useState(value)

  return (
    <input
      autoFocus={autofocus}
      placeholder={placeholder}
      className="input-text"
      type="text"
      name={name}
      id={id}
      value={internalValue}
      onChange={e => setValue(e.target.value)}
    />
  )
}

export default InputText