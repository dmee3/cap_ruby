import React, { forwardRef } from 'react'
import { textStyles } from '../../tokens'
import './Input.scss'

export type InputType = 'text' | 'email' | 'password' | 'number' | 'tel' | 'url' | 'search' | 'date' | 'time' | 'datetime-local'
export type InputSize = 'sm' | 'md' | 'lg'
export type InputVariant = 'default' | 'error' | 'success'

export interface InputProps {
  type?: InputType
  size?: InputSize
  variant?: InputVariant
  placeholder?: string
  value?: string | number
  defaultValue?: string | number
  disabled?: boolean
  readOnly?: boolean
  required?: boolean
  autoFocus?: boolean
  name?: string
  id?: string
  className?: string
  onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void
  onFocus?: (event: React.FocusEvent<HTMLInputElement>) => void
  onBlur?: (event: React.FocusEvent<HTMLInputElement>) => void
  onKeyDown?: (event: React.KeyboardEvent<HTMLInputElement>) => void
  'aria-label'?: string
  'aria-describedby'?: string
}

const Input = forwardRef<HTMLInputElement, InputProps>(({
  type = 'text',
  size = 'md',
  variant = 'default',
  placeholder,
  value,
  defaultValue,
  disabled = false,
  readOnly = false,
  required = false,
  autoFocus = false,
  name,
  id,
  className = '',
  onChange,
  onFocus,
  onBlur,
  onKeyDown,
  'aria-label': ariaLabel,
  'aria-describedby': ariaDescribedby,
}, ref) => {
  // Build CSS classes
  const inputClasses = [
    'input-base',
    `input-variant--${variant}`,
    `input-size--${size}`,
    className
  ].filter(Boolean).join(' ')

  return (
    <input
      ref={ref}
      type={type}
      placeholder={placeholder}
      value={value}
      defaultValue={defaultValue}
      disabled={disabled}
      readOnly={readOnly}
      required={required}
      autoFocus={autoFocus}
      name={name}
      id={id}
      className={inputClasses}
      onChange={onChange}
      onFocus={onFocus}
      onBlur={onBlur}
      onKeyDown={onKeyDown}
      aria-label={ariaLabel}
      aria-describedby={ariaDescribedby}
    />
  )
})

Input.displayName = 'Input'

export default Input
