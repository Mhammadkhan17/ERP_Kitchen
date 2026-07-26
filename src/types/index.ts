export interface Ingredient {
  id: string
  name: string
  unit: string
  currentStock: number
  reorderLevel: number
  reorderQty: number
  unitCost: number
  supplier: string
  category: string
  isLowStock: boolean
  updatedAt: string
}

export interface MenuItem {
  id: string
  name: string
  brandId: string
  brandName: string
  price: number
  category: string
  isActive: boolean
  popularity: number
}

export interface RecipeIngredient {
  ingredientId: string
  quantity: number
}

export interface Recipe {
  id: string
  menuItemId: string
  ingredients: RecipeIngredient[]
  servings: number
  version: number
}

export interface OrderItem {
  menuItemId: string
  name: string
  quantity: number
  unitPrice: number
  specialInstructions?: string
}

export interface OrderTimestamps {
  placedAt: string
  startedAt: string | null
  readyAt: string | null
  dispatchedAt: string | null
}

export type OrderStatus = 'pending' | 'preparing' | 'ready' | 'dispatched' | 'cancelled'

export interface Order {
  id: string
  orderNumber: number
  source: string
  customerName: string
  customerId?: number
  phone?: number
  items: OrderItem[]
  totalAmount: number
  status: OrderStatus
  brandId: string
  timestamps: OrderTimestamps
  prepTimeTarget: number
  updatedAt?: string
}

export interface OrderUpdatePayload {
  id: string
  status: OrderStatus
  orderNumber: number
  customerId?: number
}

export interface Brand {
  id: string
  name: string
  color: string
}

export interface DailySales {
  id: string
  date: string
  totalRevenue: number
  orderCount: number
  itemsSold: Array<{ menuItemId: string; units: number }>
}

export interface Customer {
  id: number
  name: string
  phone: number
  email: string
}

export interface WastageLog {
  id: string
  date: string
  ingredientId: string
  quantity: number
  unit: string
  reason: string
}
