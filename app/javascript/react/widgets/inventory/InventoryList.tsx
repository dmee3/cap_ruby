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
            editing: false,
            collapsed: false
          }))
        )
      })
      .catch(error => {
        console.error(error)
      })
  }, [])

  const updateCollapsed = (categoryId) => {
    setCategories(categories.map(category => {
      if (category.id === categoryId) {
        category.collapsed = !category.collapsed
      }
      return category
    }))
  }

  const sortByName = (array) => {
    return array.sort((a, b) => a.name.localeCompare(b.name))
  }

  return (
    <>
      {categories.map((category) => {
        return <div key={category.id} className="mb-6">
          <InventoryListHeading
            category={category}
            collapsed={category.collapsed}
            toggleCollapsed={() => updateCollapsed(category.id)}
          />
          {category.items && category.items.length > 0 && !category.collapsed &&
            <div className="overflow-x-auto align-middle inline-block min-w-full">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th scope="col" className="table-header">
                      Name
                    </th>
                    <th scope="col" className="table-header">
                      Qty
                    </th>
                    <th scope="col" className="relative px-6 py-3">
                      <span className="sr-only">Edit</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="table-body">
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
          {category.items.length == 0 && !category.collapsed &&
            <div className="px-9 py-4">
              <span className="italic text-gray-500">Nothing Here</span>
            </div>
          }
        </div>
      })}
    </>
  )
}

export default InventoryList
