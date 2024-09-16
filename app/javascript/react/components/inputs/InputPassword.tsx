import React, { useState } from 'react'

type InputPasswordProps = {
  autofocus?: boolean,
  id?: string,
  name: string,
  placeholder?: string,
  value?: string
}

const InputPassword = ({
  autofocus = false,
  id,
  name,
  placeholder,
  value = ''
}: InputPasswordProps) => {
  const [internalValue, setValue] = useState(value)

  return (
    <input
      autoFocus={autofocus}
      placeholder={placeholder}
      className="input-text"
      type="password"
      name={name}
      id={id}
      value={internalValue}
      onChange={e => setValue(e.target.value)}
    />
  )
}

export default InputPassword
