import React, { useEffect, useState } from 'react'
import { forwardRef } from 'react'

type InputTextProps = {
  autofocus?: boolean,
  className?: string,
  disabled?: boolean,
  id?: string,
  name: string,
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void,
  placeholder?: string,
  value?: string,
}

const InputText = forwardRef<HTMLInputElement, InputTextProps>(
  (
    {
      autofocus = false,
      className = '',
      disabled = false,
      id,
      name,
      onChange,
      placeholder,
      value = '',
    }: InputTextProps,
    ref
  ) => {
    return (
      <input
        autoFocus={autofocus}
        className={`input-text ${className}`}
        disabled={disabled}
        id={id}
        name={name}
        onChange={onChange}
        placeholder={placeholder}
        ref={ref}
        type="text"
        value={value}
      />
    )
  })

export default InputText