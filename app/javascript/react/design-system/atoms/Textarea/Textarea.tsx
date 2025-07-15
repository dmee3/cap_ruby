import React, { forwardRef } from 'react';
import styles from './Textarea.module.scss';

export type TextareaVariant = 'default' | 'error' | 'success';
export type TextareaSize = 'sm' | 'md' | 'lg';

export interface TextareaProps {
  variant?: TextareaVariant;
  size?: TextareaSize;
  placeholder?: string;
  value?: string;
  defaultValue?: string;
  disabled?: boolean;
  readOnly?: boolean;
  required?: boolean;
  autoFocus?: boolean;
  name?: string;
  id?: string;
  className?: string;
  rows?: number;
  onChange?: (event: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onFocus?: (event: React.FocusEvent<HTMLTextAreaElement>) => void;
  onBlur?: (event: React.FocusEvent<HTMLTextAreaElement>) => void;
  onKeyDown?: (event: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  'aria-label'?: string;
  'aria-describedby'?: string;
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(({
  variant = 'default',
  size = 'md',
  className = '',
  ...props
}, ref) => {
  const textareaClasses = [
    styles.textarea,
    styles[`variant--${variant}`],
    styles[`size--${size}`],
    className,
  ].filter(Boolean).join(' ');

  return <textarea ref={ref} className={textareaClasses} {...props} />;
});

Textarea.displayName = 'Textarea';

export default Textarea;
