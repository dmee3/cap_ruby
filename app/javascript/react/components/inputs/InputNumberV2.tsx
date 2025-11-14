import React, { useState, useCallback, forwardRef } from 'react'
import MaskedInput from 'react-text-mask'
import { createNumberMask } from 'text-mask-addons'

type InputNumberV2Props = {
  autofocus?: boolean
  currency?: boolean
  disabled?: boolean
  id?: string
  name: string
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void
  placeholder?: string
  value?: number | string
  className?: string
}

const unmaskNumber = (value: string) => {
  const regex = /(\d|\.)+/g
  const matches = value.match(regex)
  if (matches === null) {
    return ''
  }
  return matches.join('')
}

const InputNumberV2 = forwardRef<HTMLInputElement, InputNumberV2Props>(
  (
    {
      autofocus = false,
      currency = false,
      disabled = false,
      id,
      name,
      onChange,
      placeholder,
      value: valueProp = '',
      className = '',
    }: InputNumberV2Props,
    ref
  ) => {
    const [rawValue, setRawValue] = useState(valueProp)

    const numberMask = createNumberMask({
      allowDecimal: true,
      prefix: currency ? '$' : '',
      decimalLimit: 2,
      integerLimit: 10,
    })

    // If these two floats are different it means that the user has entered a '.'
    const currentValue =
      Number.parseFloat(String(valueProp)) !== Number.parseFloat(String(rawValue))
        ? valueProp
        : rawValue

    const inputRef = useCallback(
      (instance: MaskedInput | null) => {
        const element = instance?.inputElement as HTMLInputElement | null
        if (typeof ref === 'function') {
          ref(element)
        } else if (ref) {
          ref.current = element
        }
      },
      [ref]
    )

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const numericValue = unmaskNumber(e.currentTarget.value)
      setRawValue(numericValue)

      if (onChange) {
        // Create a synthetic event with the unmasked value
        const syntheticEvent = {
          ...e,
          target: {
            ...e.target,
            value: numericValue,
          },
          currentTarget: {
            ...e.currentTarget,
            value: numericValue,
          },
        } as React.ChangeEvent<HTMLInputElement>

        onChange(syntheticEvent)
      }
    }

    return (
      // @ts-ignore - react-text-mask types are incompatible with React 18
      <MaskedInput
        ref={inputRef}
        mask={numberMask}
        value={currentValue}
        onChange={handleChange}
        disabled={disabled}
        autoFocus={autofocus}
        placeholder={currency && !placeholder ? '$0.00' : placeholder}
        className={`input-text ${className}`}
        name={name}
        id={id}
        guide={false}
        showMask={currency}
      />
    )
  }
)

InputNumberV2.displayName = 'InputNumberV2'

export default InputNumberV2
