<script setup lang="ts">
import { computed } from 'vue'
import { useMenuItems, useBrands } from '@/modules/menu/composables/useMenu'
import { useDailySales } from '@/modules/analytics/composables/useAnalytics'
import { formatCurrency } from '@/utils/formatters'

const { data: salesData } = useDailySales()
const { data: menuItems } = useMenuItems()
const { data: brands } = useBrands()

interface BrandPerf {
  brandId: string
  brandName: string
  color: string
  revenue: number
  units: number
  pct: number
}

const brandPerformance = computed<BrandPerf[]>(() => {
  const items = menuItems.value ?? []
  const sales = salesData.value ?? []
  const brandList = brands.value ?? []

  const itemBrandMap = new Map<string, { brandId: string; brandName: string; price: number }>()
  for (const item of items) {
    itemBrandMap.set(item.id, { brandId: item.brandId, brandName: item.brandName, price: item.price })
  }

  const brandColorMap = new Map<string, string>()
  for (const b of brandList) {
    brandColorMap.set(b.id, b.color)
  }

  const brandTotals = new Map<string, { revenue: number; units: number }>()

  for (const day of sales) {
    for (const sale of day.itemsSold) {
      const itemInfo = itemBrandMap.get(sale.menuItemId)
      if (itemInfo) {
        const current = brandTotals.get(itemInfo.brandId) ?? { revenue: 0, units: 0 }
        current.revenue += sale.units * itemInfo.price
        current.units += sale.units
        brandTotals.set(itemInfo.brandId, current)
      }
    }
  }

  const totalRevenue = Array.from(brandTotals.values()).reduce((sum, b) => sum + b.revenue, 0)

  return Array.from(brandTotals.entries())
    .map(([brandId, data]) => ({
      brandId,
      brandName: items.find((i) => i.brandId === brandId)?.brandName ?? brandId,
      color: brandColorMap.get(brandId) ?? '#6C757D',
      ...data,
      pct: totalRevenue > 0 ? (data.revenue / totalRevenue) * 100 : 0,
    }))
    .sort((a, b) => b.revenue - a.revenue)
})
</script>

<template>
  <div class="card space-y-4">
    <div class="flex items-center justify-between">
      <h3 class="font-display text-sm font-bold text-[#1A1D1F] uppercase tracking-wider">Revenue by Brand</h3>
    </div>
    <div class="space-y-3">
      <div
        v-for="brand in brandPerformance"
        :key="brand.brandId"
        class="space-y-1.5"
      >
        <div class="flex items-center justify-between text-sm">
          <div class="flex items-center gap-2">
            <div
              class="w-2.5 h-2.5 rounded-full shrink-0"
              :style="{ backgroundColor: brand.color }"
            />
            <span class="font-medium text-[#1A1D1F]">{{ brand.brandName }}</span>
          </div>
          <div class="flex items-center gap-3">
            <span class="font-mono text-xs text-[#6C757D]">{{ brand.units }} units</span>
            <span class="font-mono text-sm font-semibold text-[#1A1D1F] w-20 text-right">{{ formatCurrency(brand.revenue) }}</span>
          </div>
        </div>
        <div class="w-full h-1.5 bg-[#E9ECEF] rounded-full overflow-hidden">
          <div
            class="h-full rounded-full transition-all duration-500"
            :style="{ width: `${brand.pct}%`, backgroundColor: brand.color }"
          />
        </div>
      </div>
      <div v-if="!brandPerformance.length" class="font-mono text-xs text-[#6C757D] text-center py-4">
        no data available
      </div>
    </div>
    <div class="flex items-center justify-between pt-3 border-t border-gray-200">
      <span class="font-mono text-xs text-[#6C757D] uppercase tracking-wider">Total</span>
      <span class="font-display font-bold text-base text-[#1A1D1F]">{{ formatCurrency(brandPerformance.reduce((s, b) => s + b.revenue, 0)) }}</span>
    </div>
  </div>
</template>
