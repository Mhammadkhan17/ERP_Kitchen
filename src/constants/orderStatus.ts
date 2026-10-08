import type { OrderStatus } from '@/types'

export const ORDER_STATUS_COLORS: Record<OrderStatus, string> = {
  pending: '#F4A261',
  preparing: '#4A90D9',
  ready: '#2B9348',
  dispatched: '#6C757D',
  cancelled: '#6C757D',
}

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending: 'Pending',
  preparing: 'Preparing',
  ready: 'Ready',
  dispatched: 'Dispatched',
  cancelled: 'Cancelled',
}

export const ORDER_STATUS_SEVERITY: Record<OrderStatus, string> = {
  pending: 'warn',
  preparing: 'info',
  ready: 'success',
  dispatched: 'contrast',
  cancelled: 'danger',
}

export const ORDER_STATUS_BADGE_CLASS: Record<OrderStatus, string> = {
  pending: 'bg-gray-100 text-gray-600',
  preparing: 'bg-orange-100 text-orange-700',
  ready: 'bg-green-100 text-green-700',
  dispatched: 'bg-blue-100 text-blue-700',
  cancelled: 'bg-red-100 text-red-700',
}
