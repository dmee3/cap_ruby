import React, { useEffect, useRef, useState } from 'react'
import InputText from '../../components/inputs/InputText'

type InventoryListItemQuantityProps = {
  quantity: number,
  onSubmit,
}

const InventoryListItemQuantity = ({
  quantity,
  onSubmit
}: InventoryListItemQuantityProps) => {
  const [editingQuantity, setEditingQuantity] = useState(false)
  const quantityInputRef = useRef<HTMLInputElement>(null!)

  useEffect(() => {
    if (editingQuantity) {
      quantityInputRef.current.focus()
    }
  }, [editingQuantity])

  const toggleForm = () => {
    setEditingQuantity(!editingQuantity)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const newQuantity = quantityInputRef.current.value
    onSubmit(newQuantity)
    toggleForm()
  }

  return (
    <>
      <span
        className={`btn-link btn-md justify-start ${editingQuantity ? 'hidden' : ''}`}
        onClick={() => toggleForm()}
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
        </svg>
        {quantity}
      </span>
      <form
        className={`flex flex-row space-x-2 items-center max-w-100 ${editingQuantity ? '' : 'hidden'}`}
        onSubmit={e => handleSubmit(e)}
      >
        <InputText
          name={`${name}_qty`}
          ref={quantityInputRef}
          value={quantity.toString()}
        />
        <span className="btn-sm btn-green" onClick={e => handleSubmit(e)}>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
          </svg>
        </span>
        <span className="btn-sm btn-red" onClick={() => toggleForm()}>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </span>
      </form>
    </>
  )
}

export default InventoryListItemQuantity