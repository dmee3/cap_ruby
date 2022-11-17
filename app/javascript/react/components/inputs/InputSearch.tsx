import fuzzysort from 'fuzzysort'
import React, { forwardRef, useEffect, useState } from 'react'

type InputSearchProps = {
  autofocus?: boolean,
  disabled?: boolean,
  id?: string,
  name: string,
  onChange: (s: string) => void,
  options: Array<string>,
  placeholder?: string,
  value?: string,
}

const InputSearch = forwardRef<HTMLInputElement, InputSearchProps>(
  (
    {
      autofocus = false,
      disabled = false,
      id,
      name,
      onChange,
      options,
      placeholder,
      value = '',
    }: InputSearchProps,
    ref
  ) => {
  const [internalValue, setInternalValue] = useState(value)
  const [filteredOptions, setFilteredOptions] = useState(options)
  const [optionIndex, setOptionIndex] = useState(0)
  const [optionsVisible, setOptionsVisible] = useState(false)

  useEffect(() => {
    setInternalValue(value)
  }, [value])

  const performFuzzySearch = (searchTerm, list) => (
    fuzzysort.go(
      searchTerm,
      list,
      { allowTypo: true, threshold: -50 }
    ).map(s => s.target)
  )

  const handleClick = (e) => {
    setFilteredOptions([])
    setInternalValue(e.target.innerText)
    onChange(e.target.innerText)
    setOptionsVisible(false)
  }

  const handleKeyDown = (e) => {
    // UP ARROW
    if (e.keyCode === 38) {
      if (optionIndex > 0) {
        setOptionIndex(optionIndex - 1)
      }
    }
    // DOWN ARROW
    else if (e.keyCode === 40) {
      if (optionIndex < filteredOptions.length - 1) {
        setOptionIndex(optionIndex + 1)
      }
    }
    // ENTER
    else if (e.keyCode === 13) {
      setInternalValue(filteredOptions[optionIndex])
      onChange(filteredOptions[optionIndex])
      setOptionIndex(0)
      setOptionsVisible(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value
    setInternalValue(query)

    if (query.length > 1) {
      const fuzzyResults = performFuzzySearch(query.toLowerCase(), options)
      setFilteredOptions(fuzzyResults)
      setOptionsVisible(true)
    } else {
      setOptionsVisible(false)
    }
  }

  return (
    <div>
      <input
        autoFocus={autofocus}
        disabled={disabled}
        placeholder={placeholder}
        className="input-search"
        type="text"
        name={name}
        id={id}
        ref={ref}
        value={internalValue}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
      />
      {optionsVisible && filteredOptions.length > 0 &&
        <ul className="input-search-suggestions-container">
          {filteredOptions.map((suggestion, index) => {
            return (
              <li
                className={`input-search-suggestion ${index === optionIndex ? "active" : ""}`}
                key={index}
                onClick={handleClick}
              >
                {suggestion}
              </li>
            );
          })}
        </ul>
      }
    </div>
  )
})

export default InputSearch