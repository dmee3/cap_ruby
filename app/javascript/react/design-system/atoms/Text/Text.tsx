import React from 'react'
import { textStyles, colors } from '../../tokens'
import './Text.scss'

export type TextVariant =
  | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'
  | 'body-large' | 'body' | 'body-small'
  | 'label-large' | 'label' | 'label-small'
  | 'caption'
  | 'button-large' | 'button' | 'button-small'

export type TextColor = 'primary' | 'secondary' | 'disabled' | 'inverse' | 'success' | 'warning' | 'error'

export interface TextProps {
  children: React.ReactNode
  variant?: TextVariant
  color?: TextColor
  as?: keyof JSX.IntrinsicElements
  className?: string
  truncate?: boolean
  align?: 'left' | 'center' | 'right' | 'justify'
  sx?: React.CSSProperties // For custom style overrides
  id?: string
  htmlFor?: string
  [key: string]: any // Allow additional HTML attributes
}

const Text: React.FC<TextProps> = ({
  children,
  variant = 'body',
  color = 'primary',
  as,
  className = '',
  truncate = false,
  align = 'left',
  sx,
  id,
  htmlFor,
  ...otherProps
}) => {
  // Get the appropriate text style
  const getTextStyle = (variant: TextVariant) => {
    switch (variant) {
      case 'h1':
        return textStyles.h1
      case 'h2':
        return textStyles.h2
      case 'h3':
        return textStyles.h3
      case 'h4':
        return textStyles.h4
      case 'h5':
        return textStyles.h5
      case 'h6':
        return textStyles.h6
      case 'body-large':
        return textStyles.body.large
      case 'body':
        return textStyles.body.base
      case 'body-small':
        return textStyles.body.small
      case 'label-large':
        return textStyles.label.large
      case 'label':
        return textStyles.label.base
      case 'label-small':
        return textStyles.label.small
      case 'caption':
        return textStyles.caption
      case 'button-large':
        return textStyles.button.large
      case 'button':
        return textStyles.button.base
      case 'button-small':
        return textStyles.button.small
      default:
        return textStyles.body.base
    }
  }

  // Build CSS classes
  const textClasses = [
    `text-color--${color}`,
    `text-align--${align}`,
    truncate ? 'text-truncate' : '',
    className
  ].filter(Boolean).join(' ')

  // Determine the HTML element to render
  const getElement = (variant: TextVariant, as?: keyof JSX.IntrinsicElements) => {
    if (as) return as

    // Map variants to semantic HTML elements
    switch (variant) {
      case 'h1':
        return 'h1'
      case 'h2':
        return 'h2'
      case 'h3':
        return 'h3'
      case 'h4':
        return 'h4'
      case 'h5':
        return 'h5'
      case 'h6':
        return 'h6'
      case 'label-large':
      case 'label':
      case 'label-small':
        return 'label'
      default:
        return 'span'
    }
  }

  const Element = getElement(variant, as) as keyof JSX.IntrinsicElements
  const textStyle = getTextStyle(variant)

  return (
    <Element
      className={textClasses}
      style={{
        fontSize: textStyle.fontSize,
        fontWeight: textStyle.fontWeight,
        lineHeight: textStyle.lineHeight,
        letterSpacing: textStyle.letterSpacing,
        ...sx,
      }}
      id={id}
      htmlFor={htmlFor}
      {...otherProps}
    >
      {children}
    </Element>
  )
}

export default Text
