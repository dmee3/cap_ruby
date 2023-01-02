import React, { useState, useRef } from 'react'
import InputText from '../../components/inputs/InputText'

type InventoryListItemProps = {
  categoryId: number,
  item: {
    id: number,
    name: string,
    quantity: number
  }
}

const InventoryListItem = ({
  categoryId,
  item
}: InventoryListItemProps) => {
  const csrfToken = (document.getElementsByName('csrf-token')[0] as HTMLMetaElement).content
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(item.name)
  const [quantity, setQuantity] = useState(item.quantity.toString())
  const nameInputRef = useRef<HTMLInputElement>(null!)

  const updateItem = (evt) => {
    evt.preventDefault()
    fetch(
      `/api/inventory/categories/${categoryId}/items/${item.id}`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': csrfToken
        },
        body: JSON.stringify({ item: { name: name, quantity: quantity } })
      }
    ).then(resp => {
      if (resp.ok) {
        return resp.json()
      }
      throw resp
    }).then(data => {
      setName(data.name)
      setQuantity(data.quantity)
      toggleEditing()
    }).catch(error => {
      console.error(error)
    })
  }

  const toggleEditing = () => {
    setEditing(!editing)
  }

  return (
    <tr
      className="hover:bg-gray-100 dark:hover:bg-gray-800 transition cursor-pointer group"
      onClick={() => toggleEditing()}
    >
      {editing && (
        <td colSpan={3} className="table-cell font-medium">
          <form className="align-center items-center flex flex-row justify-between" onClick={evt => evt.stopPropagation()} onSubmit={evt => updateItem(evt)}>
            <InputText
              autofocus
              className="mx-2 my-0 group-hover:bg-white dark:group-hover:bg-gray-900"
              name={`${name}_name`}
              onChange={evt => setName(evt.target.value)}
              value={name}
            />
            <InputText
              className="mx-2 my-0 group-hover:bg-white dark:group-hover:bg-gray-900"
              name={`${name}_qty`}
              onChange={evt => setQuantity(evt.target.value)}
              value={quantity}
            />
            <div className="align-center flex flex-row space-x-2">
              <span className="btn-sm btn-green h-8" onClick={evt => updateItem(evt)}>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
              </span>
              <span className="btn-sm btn-red h-8" onClick={() => toggleEditing()}>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </span>
              <input type="submit" className="hidden" />
            </div>
          </form>
        </td>
      )}
      {!editing && (
        <>
          <td className="table-cell font-medium text-gray-900 dark:text-white group-hover:text-gray-500">
            {name}
          </td>
          <td className="table-cell font-medium text-gray-900 dark:text-white group-hover:text-gray-500">
            {quantity}
          </td>
          <td className="table-cell text-right font-medium">
            <a href={`/inventory/categories/${categoryId}/items/${item.id}`} className="link">History</a>
          </td>
        </>
      )}
    </tr>
  )
}

export default InventoryListItem
