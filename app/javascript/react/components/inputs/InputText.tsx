import React, { useEffect, useState } from 'react'
import { forwardRef } from 'react'

type InputTextProps = {
  autofocus?: boolean,
  disabled?: boolean,
  id?: string,
  name: string,
  placeholder?: string,
  value?: string,
}

const InputText = forwardRef<HTMLInputElement, InputTextProps>(
  (
    {
      autofocus = false,
      disabled = false,
      id,
      name,
      placeholder,
      value = '',
    }: InputTextProps,
    ref
  ) => {
  const [internalValue, setInternalValue] = useState(value)
  useEffect(() => {
    setInternalValue(value)
  }, [value])

  return (
    <input
      autoFocus={autofocus}
      disabled={disabled}
      placeholder={placeholder}
      className="input-text"
      type="text"
      name={name}
      id={id}
      ref={ref}
      value={internalValue}
      onChange={e => setInternalValue(e.target.value)}
    />
  )
})

export default InputText