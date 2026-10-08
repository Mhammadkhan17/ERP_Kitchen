import { describe, it, expect } from 'vitest'
import { aggregateSales } from './aggregateSales'
import type { DailySales } from '@/types'

function day(date: string, revenue: number, orderCount: number, items: Array<[string, number]>): DailySales {
  return {
    id: `sales-${date}`,
    date,
    totalRevenue: revenue,
    orderCount,
    itemsSold: items.map(([menuItemId, units]) => ({ menuItemId, units })),
  }
}

const sample: DailySales[] = [
  day('2026-03-02', 100, 2, [['item-001', 3]]), // Monday week 10
  day('2026-03-04', 50, 1, [['item-001', 1], ['item-002', 2]]),
  day('2026-03-09', 80, 2, [['item-002', 4]]), // next week
  day('2026-04-01', 200, 5, [['item-003', 9]]), // April
]

describe('aggregateSales', () => {
  it('returns empty array for empty input in any period', () => {
    expect(aggregateSales([], 'daily')).toEqual([])
    expect(aggregateSales([], 'weekly')).toEqual([])
    expect(aggregateSales([], 'monthly')).toEqual([])
  })

  it('daily preserves rows sorted by date with labels equal to dates', () => {
    const result = aggregateSales(sample, 'daily')
    expect(result.map((r) => r.label)).toEqual([
      '2026-03-02', '2026-03-04', '2026-03-09', '2026-04-01',
    ])
    expect(result[0].revenue).toBe(100)
  })

  it('weekly buckets by ISO week and sums revenue, orders, and item units', () => {
    const result = aggregateSales(sample, 'weekly')
    const labels = result.map((r) => r.label)
    expect(labels).toContain('2026-W10')
    expect(labels).toContain('2026-W11')
    expect(labels).toContain('2026-W14')

    const w10 = result.find((r) => r.label === '2026-W10')!
    expect(w10.revenue).toBe(150)
    expect(w10.orderCount).toBe(3)
    expect(w10.itemsSold).toEqual([
      { menuItemId: 'item-001', units: 4 },
      { menuItemId: 'item-002', units: 2 },
    ])
  })

  it('monthly buckets by YYYY-MM', () => {
    const result = aggregateSales(sample, 'monthly')
    expect(result.map((r) => r.label)).toEqual(['2026-03', '2026-04'])
    const march = result.find((r) => r.label === '2026-03')!
    expect(march.revenue).toBe(230)
    expect(march.orderCount).toBe(5)
  })
})
