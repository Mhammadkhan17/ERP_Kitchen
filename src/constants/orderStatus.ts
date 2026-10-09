import type { OrderStatus } from '@/types'

export const ORDER_STATUS_HEX: Record<OrderStatus, string> = {
  pending: '#b45309',
  preparing: '#2563eb',
  ready: '#15803d',
  dispatched: '#4b5563',
  cancelled: '#4b5563',
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

export const ORDER_STATUS_TINT_CLASS: Record<OrderStatus, string> = {
  pending: 'bg-amber-50 text-amber-700',
  preparing: 'bg-blue-50 text-blue-600',
  ready: 'bg-green-50 text-green-700',
  dispatched: 'bg-gray-100 text-gray-600',
  cancelled: 'bg-gray-100 text-gray-600',
}

export const ORDER_STATUS_SPINE_CLASS: Record<OrderStatus, string> = {
  pending: 'bg-amber-600',
  preparing: 'bg-blue-600',
  ready: 'bg-green-600',
  dispatched: 'bg-gray-500',
  cancelled: 'bg-gray-400',
}

export const ORDER_STATUS_TEXT_CLASS: Record<OrderStatus, string> = {
  pending: 'text-amber-700',
  preparing: 'text-blue-600',
  ready: 'text-green-700',
  dispatched: 'text-gray-600',
  cancelled: 'text-gray-600',
}

export const ORDER_STATUS_CTA: Record<
  OrderStatus,
  { label: string; severity: 'info' | 'success' | 'contrast' } | null
> = {
  pending: { label: 'Start', severity: 'info' },
  preparing: { label: 'Ready', severity: 'info' },
  ready: { label: 'Dispatch', severity: 'success' },
  dispatched: null,
  cancelled: null,
}

export const TIMER_THRESHOLDS = { soonMinutes: 8, lateMinutes: 12 } as const

export type TimerTier = 'ontrack' | 'soon' | 'late'

export function timerTier(elapsedMinutes: number): TimerTier {
  if (elapsedMinutes >= TIMER_THRESHOLDS.lateMinutes) return 'late'
  if (elapsedMinutes >= TIMER_THRESHOLDS.soonMinutes) return 'soon'
  return 'ontrack'
}

export const TIMER_TIER_CLASS: Record<TimerTier, string> = {
  ontrack: 'text-green-700',
  soon: 'text-amber-700',
  late: 'text-red-600',
}
