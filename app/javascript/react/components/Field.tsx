import React, { createContext, useContext, useRef } from 'react'

export type ControlSize = 'sm' | 'md'

type ControlStyle = {
  controlSize?: ControlSize
  invalid?: boolean
  mono?: boolean
}

const SIZE: Record<ControlSize, string> = {
  sm: 'h-10 px-2.5 text-body-sm',
  md: 'h-11 px-3 text-body',
}

/**
 * The one look for a text box, select or date input. Exported for controls
 * that wrap their own input (MoneyField's `$` prefix, MemberCombobox) — they
 * apply it to the wrapper and use `focus-within` instead.
 */
export const controlClass = ({ controlSize = 'md', invalid = false, mono = false }: ControlStyle = {}) =>
  [
    'rounded-sm border bg-surface text-primary placeholder:text-secondary',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1',
    'disabled:bg-sunken disabled:text-secondary',
    // The second pixel of an error edge is an inset shadow, so the box doesn't
    // grow when a field turns invalid.
    invalid
      ? 'border-danger-fg shadow-[inset_0_0_0_1px_rgb(var(--status-danger-fg))]'
      : 'border-border-strong',
    SIZE[controlSize],
    mono ? 'font-mono' : '',
  ]
    .filter(Boolean)
    .join(' ')

type FieldContextValue = {
  id: string
  describedBy?: string
  invalid: boolean
}

const FieldContext = createContext<FieldContextValue | null>(null)

// React 18's useId would do, but @types/react is still on 17. Nothing renders
// server-side, so a counter can't mismatch.
let lastId = 0
const useGeneratedId = () => {
  const id = useRef<string>()
  if (!id.current) id.current = `field-${++lastId}`
  return id.current
}

/** For a control that renders its own input inside a Field. */
export const useField = () => useContext(FieldContext)

type FieldProps = {
  label: React.ReactNode
  /** The control's id. Generated when omitted; pass one when something links to it. */
  id?: string
  /** Explanation that belongs before the control is used — sits under the label. */
  description?: React.ReactNode
  /** Help under the control. An error replaces it. */
  hint?: React.ReactNode
  error?: React.ReactNode
  optional?: boolean
  /** Right of the label: a character count, a link. */
  aside?: React.ReactNode
  /**
   * `inline` puts the label in a 150px column beside the control from `sm` up,
   * with the hint under the label rather than the control.
   */
  layout?: 'stacked' | 'inline'
  /** Hide the label visually when the surrounding UI already names the control. */
  hideLabel?: boolean
  /**
   * What sits under the label isn't one labelable control — a value shown
   * rather than edited, or a stepper built from buttons — so the label is
   * plain text rather than a `<label>` pointing at nothing.
   */
  noControl?: boolean
  className?: string
  children: React.ReactNode
}

const Field = ({
  label,
  id: givenId,
  description,
  hint,
  error,
  optional = false,
  aside,
  layout = 'stacked',
  hideLabel = false,
  noControl = false,
  className = '',
  children,
}: FieldProps) => {
  const generatedId = useGeneratedId()
  const id = givenId ?? generatedId
  const descriptionId = description ? `${id}-description` : undefined
  const messageId = error || hint ? `${id}-${error ? 'error' : 'hint'}` : undefined
  const describedBy = [descriptionId, messageId].filter(Boolean).join(' ') || undefined

  const message = error ? (
    <span id={messageId} className="text-caption text-danger-fg">
      {error}
    </span>
  ) : (
    hint && (
      <span id={messageId} className="text-caption text-secondary">
        {hint}
      </span>
    )
  )

  const labelRow = (
    <div className={hideLabel ? 'sr-only' : 'flex items-baseline gap-2'}>
      {noControl ? (
        <span className="text-body-sm font-semibold text-primary">{label}</span>
      ) : (
        <label htmlFor={id} className="text-body-sm font-semibold text-primary">
          {label}
        </label>
      )}
      {optional && <span className="text-caption text-secondary">Optional</span>}
      {aside && <span className="ml-auto text-caption text-secondary">{aside}</span>}
    </div>
  )

  const descriptionText = description && (
    <p id={descriptionId} className="m-0 text-body-sm text-secondary">
      {description}
    </p>
  )

  return (
    <FieldContext.Provider value={{ id, describedBy, invalid: Boolean(error) }}>
      {layout === 'inline' ? (
        <div className={`flex flex-col gap-2 sm:flex-row sm:gap-4 ${className}`.trim()}>
          <div className="flex flex-col gap-0.5 sm:w-[150px] sm:flex-none sm:pt-2.5">
            {labelRow}
            {descriptionText}
            {message}
          </div>
          <div className="flex flex-1 flex-col gap-2">{children}</div>
        </div>
      ) : (
        <div className={`flex flex-col gap-1.5 ${className}`.trim()}>
          {labelRow}
          {descriptionText}
          {children}
          {message}
        </div>
      )}
    </FieldContext.Provider>
  )
}

export default Field

// ---- Controls ------------------------------------------------------------
//
// Each reads the surrounding Field for its id, description and invalid state,
// so a control inside a Field is labelled and described without wiring.

type ControlProps = ControlStyle & { className?: string }

const useControl = ({ id, invalid, ...rest }: { id?: string; invalid?: boolean } & Record<string, unknown>) => {
  const field = useField()
  const isInvalid = invalid ?? field?.invalid ?? false
  return {
    id: id ?? field?.id,
    'aria-describedby': (rest['aria-describedby'] as string | undefined) ?? field?.describedBy,
    'aria-invalid': isInvalid || undefined,
    invalid: isInvalid,
  }
}

export const TextInput = ({
  controlSize,
  invalid,
  mono,
  className = '',
  ...rest
}: ControlProps & React.InputHTMLAttributes<HTMLInputElement>) => {
  const { invalid: isInvalid, ...a11y } = useControl({ invalid, ...rest })
  return (
    <input
      type="text"
      {...rest}
      {...a11y}
      className={`${controlClass({ controlSize, invalid: isInvalid, mono })} ${className}`.trim()}
    />
  )
}

export const Select = ({
  controlSize,
  invalid,
  mono,
  className = '',
  children,
  ...rest
}: ControlProps & React.SelectHTMLAttributes<HTMLSelectElement>) => {
  const { invalid: isInvalid, ...a11y } = useControl({ invalid, ...rest })
  return (
    <select
      {...rest}
      {...a11y}
      className={`${controlClass({ controlSize, invalid: isInvalid, mono })} ${className}`.trim()}
    >
      {children}
    </select>
  )
}

export const Textarea = ({
  invalid,
  className = '',
  ...rest
}: Omit<ControlProps, 'controlSize' | 'mono'> & React.TextareaHTMLAttributes<HTMLTextAreaElement>) => {
  const { invalid: isInvalid, ...a11y } = useControl({ invalid, ...rest })
  return (
    <textarea
      {...rest}
      {...a11y}
      className={`${controlClass({ invalid: isInvalid })} !h-auto min-h-24 py-3 ${className}`.trim()}
    />
  )
}
