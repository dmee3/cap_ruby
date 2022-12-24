import React from 'react'
import { render } from 'react-dom'
import { PlusSmallIcon } from '@heroicons/react/24/outline'
import InventoryList from '../../../react/widgets/inventory/InventoryList'

const Inventory = () => {
  render(
    <div className="flex flex-col">
      <div className="flex flex-row items-center justify-between mt-4 mb-2">
        <h1 className="m-0">Inventory</h1>
        <a href="/inventory/categories/new" className="btn-green btn-lg">
          <PlusSmallIcon className="mr-2 h-6 w-6" />
          <span className="hidden md-inline">New </span>Category
        </a>
      </div>

      <InventoryList />
    </div>,
    document.getElementById('inventory')
  )
}

Inventory()
