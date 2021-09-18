import React from 'react'
import { render } from 'react-dom'
import InventoryList from '../../react/widgets/inventory/InventoryList'

const Inventory = () => {
  render(
    <div className="flex flex-col">
      <div className="flex flex-row items-center justify-between mt-4 mb-2">
        <h1 className="m-0">Inventory</h1>
        <a href="/inventory/categories/new" className="btn-green btn-lg">
          <svg className="mr-2" width="12" height="20" fill="currentColor">
            <path fillRule="evenodd" clipRule="evenodd" d="M6 5a1 1 0 011 1v3h3a1 1 0 110 2H7v3a1 1 0 11-2 0v-3H2a1 1 0 110-2h3V6a1 1 0 011-1z"/>
          </svg>
          <span className="hidden md-inline">New </span>Category
        </a>
      </div>

      <InventoryList />
    </div>,
    document.getElementById('inventory')
  )
}

Inventory()
