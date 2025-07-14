import React, { useState, forwardRef } from 'react'
import { Input } from '../../atoms'
import { Icon } from '../../atoms'
import { MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline'
import './SearchBar.scss'

export interface SearchBarProps {
  placeholder?: string
  value?: string
  onChange?: (value: string) => void
  onSearch?: (value: string) => void
  onClear?: () => void
  disabled?: boolean
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

const SearchBar = forwardRef<HTMLInputElement, SearchBarProps>(({
  placeholder = 'Search...',
  value: controlledValue,
  onChange,
  onSearch,
  onClear,
  disabled = false,
  className = '',
  size = 'md',
}, ref) => {
  const [internalValue, setInternalValue] = useState('')
  const value = controlledValue !== undefined ? controlledValue : internalValue

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    if (controlledValue === undefined) {
      setInternalValue(newValue)
    }
    onChange?.(newValue)
  }

  const handleClear = () => {
    if (controlledValue === undefined) {
      setInternalValue('')
    }
    onChange?.('')
    onClear?.()
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      onSearch?.(value)
    }
  }

  const showClearButton = value.length > 0

  return (
    <div className={`search-bar ${className}`}>
      <div className="search-bar__icon-container">
        <Icon size={size === 'lg' ? 'lg' : size === 'sm' ? 'sm' : 'md'}>
          <MagnifyingGlassIcon />
        </Icon>
      </div>

      <Input
        ref={ref}
        type="search"
        placeholder={placeholder}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        size={size}
        className="search-bar__input"
      />

      {showClearButton && (
        <button
          type="button"
          onClick={handleClear}
          className="search-bar__clear-button"
          aria-label="Clear search"
        >
          <Icon size={size === 'lg' ? 'lg' : size === 'sm' ? 'sm' : 'md'} color="gray">
            <XMarkIcon />
          </Icon>
        </button>
      )}
    </div>
  )
})

SearchBar.displayName = 'SearchBar'

export default SearchBar
