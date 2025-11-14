import React from 'react'
import { forwardRef } from 'react'

type InputTextareaProps = {
  autofocus?: boolean,
  className?: string,
  disabled?: boolean,
  id?: string,
  name: string,
  onChange?: (e: React.ChangeEvent<HTMLTextAreaElement>) => void,
  placeholder?: string,
  rows?: number,
  value?: string,
}

const InputTextarea = forwardRef<HTMLTextAreaElement, InputTextareaProps>(
  (
    {
      autofocus = false,
      className = '',
      disabled = false,
      id,
      name,
      onChange,
      placeholder,
      rows = 3,
      value = '',
    }: InputTextareaProps,
    ref
  ) => {
    return (
      <textarea
        autoFocus={autofocus}
        className={`input-text ${className}`}
        disabled={disabled}
        id={id}
        name={name}
        onChange={onChange}
        placeholder={placeholder}
        ref={ref}
        rows={rows}
        value={value}
      />
    )
  })

export default InputTextarea
