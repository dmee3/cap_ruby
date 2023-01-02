import React, { useState, useRef, useEffect } from 'react'
import InputText from '../../components/inputs/InputText'

type InventoryListHeadingProps = {
  category: {
    id: number,
    name: string
  }
}

const InventoryListHeading = ({
  category
}: InventoryListHeadingProps) => {
  const csrfToken = (document.getElementsByName('csrf-token')[0] as HTMLMetaElement).content
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(category.name)
  const inputRef = useRef<HTMLInputElement>(null!)

  useEffect(() => {
    if (editing) {
      inputRef.current.focus()
    }
  }, [editing])

  const toggleForm = () => {
    setEditing(!editing)
  }

  const submitCategory = (e) => {
    e.preventDefault()
    const newName = inputRef.current.value

    fetch(
      `/api/inventory/categories/${category.id}`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': csrfToken
        },
        body: JSON.stringify({ category: { name: newName } })
      }
    ).then(resp => {
      if (resp.ok) {
        return resp.json()
      }
      throw resp
    }).then(data => {
      setName(data.name)
    }).catch(error => {
      console.error(error)
    })

    toggleForm()
  }

  return (
    <div className="flex flex-row items-center justify-between my-2 col-span-5">
      {!editing &&
        <div
          className="btn-link btn-md text-gray-900 dark:text-white hover:text-gray-500 transition"
          onClick={() => toggleForm()}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
          </svg>
          <h2 className="m-0">{name}</h2>
        </div>
      }
      {editing &&
        <form
          className="flex flex-row space-x-2 items-center"
          onSubmit={e => submitCategory(e)}
        >
          <InputText
            name={name}
            ref={inputRef}
            value={name}
          />
          <span className="btn-sm btn-green" onClick={e => submitCategory(e)}>
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
      }
      <div className="shrink">
        <a href={`/inventory/categories/${category.id}/items/new`} className="btn-green btn-lg">
          <svg className="mr-2" width="12" height="20" fill="currentColor">
            <path fillRule="evenodd" clipRule="evenodd" d="M6 5a1 1 0 011 1v3h3a1 1 0 110 2H7v3a1 1 0 11-2 0v-3H2a1 1 0 110-2h3V6a1 1 0 011-1z" />
          </svg>
          Item
        </a>
      </div>
    </div>
  )
}

export default InventoryListHeading