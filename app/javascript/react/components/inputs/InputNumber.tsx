import * as React from 'react'
import { forwardRef } from 'react'

type InputNumberProps = {
  autofocus?: boolean,
  currency?: boolean,
  disabled?: boolean,
  id?: string,
  masked?: boolean,
  min?: number,
  name: string,
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void,
  placeholder?: string,
  step?: number,
  value?: number
}

const InputNumber = forwardRef<HTMLInputElement, InputNumberProps>(
  (
    {
      autofocus = false,
      currency = false,
      disabled = false,
      id,
      masked = false,
      min,
      name,
      onChange,
      placeholder,
      step,
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
          name={name}
          id={id}
          ref={ref}
          min={min}
          type={masked ? 'text' : 'number'}
          step={step}
          value={currency ? value.toFixed(2) : value}
          onChange={onChange}
        />
      </>
    )
  })

export default InputNumber
