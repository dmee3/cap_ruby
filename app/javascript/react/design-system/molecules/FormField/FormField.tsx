import React, { forwardRef } from 'react';
import cx from 'classnames';
import {
  Text,
  Input, InputProps,
  Textarea, TextareaProps,
  Select, SelectProps,
  Checkbox, CheckboxProps,
  Radio, RadioProps,
} from '../../atoms';
import styles from './FormField.module.scss';

type As = 'input' | 'textarea' | 'select' | 'checkbox' | 'radio';

type AllFieldProps =
  & Omit<InputProps, 'label'>
  & Omit<TextareaProps, 'label'>
  & Omit<SelectProps, 'label'>
  & Omit<CheckboxProps, 'label'>
  & Omit<RadioProps, 'label'>
  & { label?: React.ReactNode };


export interface FormFieldProps extends Omit<AllFieldProps, 'variant'> {
  as?: As;
  label?: string;
  labelSize?: 'sm' | 'md' | 'lg';
  required?: boolean;
  error?: string;
  helpText?: string;
  className?: string;
}

const FormField = forwardRef<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement, FormFieldProps>(({
  as = 'input',
  label,
  labelSize = 'md',
  required = false,
  error,
  helpText,
  className = '',
  id,
  name,
  ...props
}, ref) => {
  const fieldId = id || name || `field-${Math.random().toString(36).substr(2, 9)}`;
  const errorId = error ? `${fieldId}-error` : undefined;
  const helpId = helpText ? `${fieldId}-help` : undefined;
  const describedBy = [errorId, helpId].filter(Boolean).join(' ');

  const getLabelSize = (size: string) => {
    switch (size) {
      case 'sm': return 'label-small';
      case 'lg': return 'label-large';
      default: return 'label';
    }
  };

  const fieldProps = {
    id: fieldId,
    name: name,
    'aria-describedby': describedBy || undefined,
    ...props,
  };

  const renderField = () => {
    switch (as) {
      case 'textarea':
        return <Textarea ref={ref as React.Ref<HTMLTextAreaElement>} variant={error ? 'error' : 'default'} {...fieldProps} />;
      case 'select':
        return <Select ref={ref as React.Ref<HTMLSelectElement>} variant={error ? 'error' : 'default'} {...fieldProps} />;
      case 'checkbox':
        // Checkbox has its own label, so we don't render the FormField label
        return <Checkbox ref={ref as React.Ref<HTMLInputElement>} label={label} {...fieldProps} />;
      case 'radio':
        // Radio has its own label, so we don't render the FormField label
        return <Radio ref={ref as React.Ref<HTMLInputElement>} label={label} {...fieldProps} />;
      case 'input':
      default:
        return <Input ref={ref as React.Ref<HTMLInputElement>} variant={error ? 'error' : 'default'} {...fieldProps} />;
    }
  };

  const shouldRenderLabel = as !== 'checkbox' && as !== 'radio' && label;

  return (
    <div className={cx(styles.formField, className)}>
      {shouldRenderLabel && (
        <Text
          as="label"
          variant={getLabelSize(labelSize)}
          htmlFor={fieldId}
          className={styles.label}
        >
          {label}
          {required && <span className={styles.required}>*</span>}
        </Text>
      )}

      {renderField()}

      {error && (
        <Text variant="caption" color="error" id={errorId} className={styles.error}>
          {error}
        </Text>
      )}

      {helpText && !error && (
        <Text variant="caption" color="secondary" id={helpId} className={styles.help}>
          {helpText}
        </Text>
      )}
    </div>
  );
});

FormField.displayName = 'FormField';

export default FormField;
