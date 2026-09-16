import React from 'react'
import { createRoot } from 'react-dom/client'
import ItemHistory, { ItemHistoryPayload } from '../../../react/widgets/inventory/ItemHistory'

declare global {
  interface Window {
    itemHistory: ItemHistoryPayload
  }
}

const mount = document.getElementById('item-history')

if (mount && window.itemHistory) {
  createRoot(mount).render(<ItemHistory payload={window.itemHistory} />)
}
