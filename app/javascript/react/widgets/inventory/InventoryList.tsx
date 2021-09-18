import React, { useState, useEffect } from 'react'
import InventoryListHeading from './InventoryListHeading'
import InventoryListItem from './InventoryListItem'

type InventoryListProps = {}

const InventoryList = ({
}: InventoryListProps) => {
  const [categories, setCategories] = useState([])

  useEffect(() => {
    fetch(`/api/inventory/categories`)
      .then(resp => {
        if (resp.ok) {
          return resp.json()
        }
        throw resp
      })
      .then(data => {
        setCategories(
          sortByName(data).map(d => ({
            ...d,
            editing: false
          }))
        )
      })
      .catch(error => {
        console.error(error)
      })
  }, [])

  const sortByName = (array) => {
    return array.sort((a, b) => a.name.localeCompare(b.name))
  }

  return(
    <>
      {categories.map((category) => {
        return <div key={category.id}>
            <InventoryListHeading
              category={category}
            />
            {category.items && category.items.length > 0 &&
              <div className="overflow-x-auto align-middle inline-block min-w-full">
                <table className="min-w-full divide-y divide-gray-500">
                  <thead>
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Name
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Qty
                      </th>
                      <th scope="col" className="relative px-6 py-3">
                        <span className="sr-only">Edit</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-300 text-sm">
                    {sortByName(category.items).map((item) => {
                      return <InventoryListItem
                        item={item}
                        categoryId={category.id}
                        key={item.id}
                      />
                    })}
                  </tbody>
                </table>
              </div>
            }
            {category.items.length == 0 &&
              <div className="text-center py-4">
                <h3 className="text-secondary">Nothing Here Yet</h3>
              </div>
            }
          </div>
      })}
    </>
  )
}

export default InventoryList
