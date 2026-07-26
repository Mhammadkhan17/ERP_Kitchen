<script setup lang="ts">
import { computed } from 'vue'
import { formatCurrency, formatDate } from '@/utils/formatters'
import type { DailySales } from '@/types'

const props = defineProps<{
  salesData: DailySales[]
}>()

const maxRevenue = computed(() =>
  Math.max(...props.salesData.map((d) => d.totalRevenue), 1),
)

const bars = computed(() =>
  props.salesData.map((d) => ({
    date: formatDate(d.date),
    revenue: d.totalRevenue,
    pct: (d.totalRevenue / maxRevenue.value) * 100,
  })),
)
</script>

<template>
  <div class="card">
    <h3 class="text-base font-semibold text-gray-900 mb-4">Daily Revenue</h3>
    <div class="flex items-end gap-2 h-48 overflow-x-auto pb-1">
      <div
        v-for="(bar, i) in bars"
        :key="i"
        class="flex-1 flex flex-col items-center min-w-[2rem] group relative"
      >
        <div class="relative w-full flex justify-center">
          <div
            class="w-full max-w-10 bg-orange-500 rounded-t-md transition-all duration-300 group-hover:bg-orange-600"
            :style="{ height: `${Math.max(bar.pct, 2)}%` }"
          />
        </div>
        <span class="text-[10px] text-gray-400 mt-1 truncate w-full text-center">{{ bar.date }}</span>
        <div class="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs rounded px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
          {{ formatCurrency(bar.revenue) }}
        </div>
      </div>
    </div>
    <div v-if="!salesData.length" class="text-center text-gray-400 py-8 text-sm">
      No sales data available
    </div>
  </div>
</template>
