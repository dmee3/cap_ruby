import * as React from 'react'
import { forwardRef } from 'react'

type InputNumberProps = {
  autofocus?: boolean,
  currency?: boolean,
  disabled?: boolean,
  id?: string,
  min?: number,
  name: string,
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void,
  placeholder?: string,
  value?: number
}

const InputNumber = forwardRef<HTMLInputElement, InputNumberProps>(
  (
    {
      autofocus = false,
      currency = false,
      disabled = false,
      id,
      min,
      name,
      onChange,
      placeholder,
      value = 0
    }: InputNumberProps,
    ref
  ) => {
  return (
    <>
      {currency &&
        <div className="text-secondary font-bold mr-3">
          $
        </div>
      }
      <input
        autoFocus={autofocus}
        disabled={disabled}
        placeholder={placeholder}
        className="input-text"
        type="number"
        name={name}
        id={id}
        ref={ref}
        min={min}
        value={currency ? value.toFixed(2) : value}
        onChange={onChange}
      />
    </>
  )
})

export default InputNumber