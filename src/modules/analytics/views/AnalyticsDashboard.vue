<script setup lang="ts">
import { ref, computed } from 'vue'
import { useDailySales, useWastageLogs, useKpiMetrics } from '@/modules/analytics/composables/useAnalytics'
import { useIngredients } from '@/modules/inventory/composables/useInventory'
import { formatCurrency } from '@/utils/formatters'
import KpiCard from '@/modules/analytics/components/KpiCard.vue'
import BrandPerformance from '@/modules/analytics/components/BrandPerformance.vue'
import DailyRevenueGraph from '@/modules/analytics/components/DailyRevenueGraph.vue'
import TopSellingTable from '@/modules/analytics/components/TopSellingTable.vue'
import WastageLog from '@/modules/analytics/components/WastageLog.vue'

const { data: salesData } = useDailySales()
const { data: wastageLogs } = useWastageLogs()
const { data: ingredients } = useIngredients()

const kpi = useKpiMetrics()

const totalWastage = computed(() =>
  (wastageLogs.value ?? []).reduce((sum, w) => sum + w.quantity, 0),
)

const activePeriod = ref<'daily' | 'weekly' | 'monthly'>('daily')
</script>

<template>
  <div class="p-6 space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="page-header">Analytics Dashboard</h1>
        <p class="page-subtitle">Sales, trends, and wastage overview</p>
      </div>
      <div class="flex gap-2">
        <button :class="activePeriod === 'daily' ? 'btn-filter-active' : 'btn-filter-inactive'" @click="activePeriod = 'daily'">Daily</button>
        <button :class="activePeriod === 'weekly' ? 'btn-filter-active' : 'btn-filter-inactive'" @click="activePeriod = 'weekly'">Weekly</button>
        <button :class="activePeriod === 'monthly' ? 'btn-filter-active' : 'btn-filter-inactive'" @click="activePeriod = 'monthly'">Monthly</button>
      </div>
    </div>

    <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      <template v-if="!salesData && !wastageLogs">
        <div v-for="i in 4" :key="i" class="card space-y-3">
          <div class="skeleton-text w-24" />
          <div class="skeleton-heading" />
          <div class="skeleton-text w-16" />
        </div>
      </template>
      <template v-else>
        <KpiCard
          title="Total Revenue"
          :value="formatCurrency(kpi.totalRevenue.value)"
          icon="pi-dollar"
          :subtitle="`${kpi.totalOrders.value} orders`"
        />
        <KpiCard
          title="Total Orders"
          :value="String(kpi.totalOrders.value)"
          icon="pi-receipt"
        />
        <KpiCard
          title="Avg Order Value"
          :value="formatCurrency(kpi.averageOrderValue.value)"
          icon="pi-chart-line"
        />
        <KpiCard
          title="Total Wastage"
          :value="`${totalWastage.toFixed(1)} units`"
          icon="pi-trash"
        />
      </template>
    </div>

    <div class="grid grid-cols-1 xl:grid-cols-3 gap-6">
      <div class="xl:col-span-2">
        <div v-if="!salesData" class="card">
          <div class="skeleton-heading mb-4" />
          <div class="skeleton h-48 w-full" />
        </div>
        <DailyRevenueGraph v-else :sales-data="salesData" />
      </div>
      <div v-if="!salesData" class="card">
        <div class="skeleton-heading mb-4" />
        <div class="skeleton h-48 w-full" />
      </div>
      <TopSellingTable v-else :sales-data="salesData" />
    </div>

    <WastageLog
      :logs="wastageLogs ?? []"
      :ingredients="ingredients ?? []"
    />

    <BrandPerformance />
  </div>
</template>
