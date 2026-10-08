import type { DailySales } from '@/types'

export type SalesPeriod = 'daily' | 'weekly' | 'monthly'

export interface AggregatedPeriod {
  label: string
  revenue: number
  orderCount: number
  itemsSold: Array<{ menuItemId: string; units: number }>
}

function weekLabel(isoDate: string): string {
  const d = new Date(`${isoDate}T00:00:00Z`)
  const dayNum = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  const week = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7)
  return `${d.getUTCFullYear()}-W${String(week).padStart(2, '0')}`
}

function monthLabel(isoDate: string): string {
  return isoDate.slice(0, 7)
}

export function aggregateSales(sales: DailySales[], period: SalesPeriod): AggregatedPeriod[] {
  const sorted = [...sales].sort((a, b) => a.date.localeCompare(b.date))

  if (period === 'daily') {
    return sorted.map((d) => ({
      label: d.date,
      revenue: d.totalRevenue,
      orderCount: d.orderCount,
      itemsSold: d.itemsSold.map((i) => ({ ...i })),
    }))
  }

  const buckets = new Map<string, AggregatedPeriod>()
  for (const day of sorted) {
    const key = period === 'weekly' ? weekLabel(day.date) : monthLabel(day.date)
    const bucket = buckets.get(key) ?? { label: key, revenue: 0, orderCount: 0, itemsSold: [] }
    bucket.revenue += day.totalRevenue
    bucket.orderCount += day.orderCount
    for (const item of day.itemsSold) {
      const existing = bucket.itemsSold.find((i) => i.menuItemId === item.menuItemId)
      if (existing) existing.units += item.units
      else bucket.itemsSold.push({ ...item })
    }
    buckets.set(key, bucket)
  }
  return Array.from(buckets.values())
}
