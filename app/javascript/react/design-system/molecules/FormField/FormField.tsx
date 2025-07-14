import React, { forwardRef } from 'react'
import { Text, Input, InputProps } from '../../atoms'
import './FormField.scss'

export interface FormFieldProps extends InputProps {
  label?: string
  labelSize?: 'sm' | 'md' | 'lg'
  required?: boolean
  error?: string
  helpText?: string
  className?: string
}

const FormField = forwardRef<HTMLInputElement, FormFieldProps>(({
  label,
  labelSize = 'md',
  required = false,
  error,
  helpText,
  className = '',
  id,
  name,
  ...inputProps
}, ref) => {
  const fieldId = id || name || `field-${Math.random().toString(36).substr(2, 9)}`
  const errorId = error ? `${fieldId}-error` : undefined
  const helpId = helpText ? `${fieldId}-help` : undefined
  const describedBy = [errorId, helpId].filter(Boolean).join(' ')

  const getLabelSize = (size: string) => {
    switch (size) {
      case 'sm':
        return 'label-small'
      case 'lg':
        return 'label-large'
      default:
        return 'label'
    }
  }

  return (
    <div className={`form-field ${className}`}>
      {label && (
        <Text
          as="label"
          variant={getLabelSize(labelSize)}
          htmlFor={fieldId}
          className="form-field__label"
        >
          {label}
          {required && <span className="form-field__required">*</span>}
        </Text>
      )}

      <Input
        ref={ref}
        id={fieldId}
        name={name}
        variant={error ? 'error' : 'default'}
        aria-describedby={describedBy || undefined}
        {...inputProps}
      />

      {error && (
        <Text
          variant="caption"
          color="error"
          id={errorId}
          className="form-field__error"
        >
          {error}
        </Text>
      )}

      {helpText && !error && (
        <Text
          variant="caption"
          color="secondary"
          id={helpId}
          className="form-field__help"
        >
          {helpText}
        </Text>
      )}
    </div>
  )
})

FormField.displayName = 'FormField'

export default FormField
