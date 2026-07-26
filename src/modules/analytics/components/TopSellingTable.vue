<script setup lang="ts">
import { computed } from 'vue'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import type { DailySales } from '@/types'

const props = defineProps<{
  salesData: DailySales[]
}>()

interface AggregatedItem {
  menuItemId: string
  units: number
}

const topItems = computed<AggregatedItem[]>(() => {
  const map = new Map<string, number>()
  for (const day of props.salesData) {
    for (const item of day.itemsSold) {
      map.set(item.menuItemId, (map.get(item.menuItemId) ?? 0) + item.units)
    }
  }
  return Array.from(map.entries())
    .map(([menuItemId, units]) => ({ menuItemId, units }))
    .sort((a, b) => b.units - a.units)
})
</script>

<template>
  <div class="card">
    <h3 class="text-base font-semibold text-gray-900 mb-4">Top Selling Items</h3>
    <DataTable
      :value="topItems"
      striped-rows
      size="small"
      scrollable
      scroll-height="flex"
      class="text-sm"
    >
      <Column header="#">
        <template #body="{ index }">
          <span class="text-gray-400 font-mono">{{ index + 1 }}</span>
        </template>
      </Column>
      <Column field="menuItemId" header="Item" class="truncate max-w-28" />
      <Column field="units" header="Sold">
        <template #body="{ data }">
          <span class="font-medium">{{ data.units }}</span>
        </template>
      </Column>
    </DataTable>
    <div v-if="!topItems.length" class="text-center text-gray-400 py-6 text-sm">
      No items sold
    </div>
  </div>
</template>
