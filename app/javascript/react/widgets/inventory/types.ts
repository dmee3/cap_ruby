export type StockStatus = 'ok' | 'low' | 'out'

export type StockAlert = {
  id: number
  operator: string
  threshold: number
}

export type StockItem = {
  id: number
  category_id: number
  name: string
  quantity: number
  status: StockStatus
  alert: StockAlert | null
}

export type StockCategory = {
  id: number
  name: string
  item_count: number
  items: StockItem[]
}

export type StockStats = {
  tracked: number
  under_alert: number
  out_of_stock: number
  no_alert: number
}

export type StockPayload = {
  categories: StockCategory[]
  stats: StockStats
  last_change: { performed_on: string; user_name: string } | null
  can_manage_alerts: boolean
}
