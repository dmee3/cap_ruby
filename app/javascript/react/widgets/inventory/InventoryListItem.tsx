import React, { useState, useEffect, useRef } from 'react'
import InventoryListItemName from './InventoryListItemName'
import InventoryListItemQuantity from './InventoryListItemQuantity'

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
  const [name, setName] = useState(item.name)
  const [quantity, setQuantity] = useState(item.quantity)

  const submitName = (newName) => {
    fetch(
      `/api/inventory/categories/${categoryId}/items/${item.id}`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': csrfToken
        },
        body: JSON.stringify({ item: { name: newName } })
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
  }

  const submitQuantity = (newQty) => {
    fetch(
      `/api/inventory/categories/${categoryId}/items/${item.id}`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': csrfToken
        },
        body: JSON.stringify({ item: { quantity: newQty } })
      }
    ).then(resp => {
      if (resp.ok) {
        return resp.json()
      }
      throw resp
    }).then(data => {
      setQuantity(data.quantity)
    }).catch(error => {
      console.error(error)
    })
  }

  return(
    <tr>
      <td className="table-cell font-medium">
        <InventoryListItemName
          name={name}
          onSubmit={newName => submitName(newName)}
        />
      </td>
      <td className="table-cell font-medium">
        <InventoryListItemQuantity
          quantity={quantity}
          onSubmit={newQty => submitQuantity(newQty)}
        />
      </td>
      <td className="table-cell text-right font-medium">
        <a href={`/inventory/categories/${categoryId}/items/${item.id}`} className="link">History</a>
      </td>
    </tr>
  )
}

export default InventoryListItem
