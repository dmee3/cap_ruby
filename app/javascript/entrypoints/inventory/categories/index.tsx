import React from 'react'
import { createRoot } from 'react-dom/client'
import StockList from '../../../react/widgets/inventory/StockList'

const mount = document.getElementById('inventory')

if (mount) {
  createRoot(mount).render(
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="m-0 text-h1 text-primary">Stock</h1>
        <div className="flex items-center gap-2">
          <a href="/inventory/categories/new" className="btn-gray btn-lg">
            Add category
          </a>
        </div>
      </div>

      <StockList />
    </div>,
  )
}
