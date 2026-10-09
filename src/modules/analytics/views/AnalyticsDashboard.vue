<script setup lang="ts">
import { computed, ref } from 'vue'
import SelectButton from 'primevue/selectbutton'
import {
  useWastageLogs,
  useAggregatedSales,
  useKpiMetrics,
} from '@/modules/analytics/composables/useAnalytics'
import { useIngredients } from '@/modules/inventory/composables/useInventory'
import { formatCurrency } from '@/utils/formatters'
import type { SalesPeriod } from '@/utils/aggregateSales'
import PageHeader from '@/components/ui/PageHeader.vue'
import AppSkeleton from '@/components/ui/AppSkeleton.vue'
import AppErrorState from '@/components/ui/AppErrorState.vue'
import KpiCard from '@/modules/analytics/components/KpiCard.vue'
import BrandPerformance from '@/modules/analytics/components/BrandPerformance.vue'
import DailyRevenueGraph from '@/modules/analytics/components/DailyRevenueGraph.vue'
import TopSellingTable from '@/modules/analytics/components/TopSellingTable.vue'
import WastageLog from '@/modules/analytics/components/WastageLog.vue'

const activePeriod = ref<SalesPeriod>('daily')

const periodOptions = [
  { label: 'Daily', value: 'daily' },
  { label: 'Weekly', value: 'weekly' },
  { label: 'Monthly', value: 'monthly' },
]

const { aggregated, isPending, isError, refetch } = useAggregatedSales(activePeriod)
const {
  data: wastageLogs,
  isPending: wastagePending,
  isError: wastageError,
  refetch: refetchWastage,
} = useWastageLogs()
const { data: ingredients } = useIngredients()

function refresh() {
  refetch()
  refetchWastage()
}

const kpi = useKpiMetrics(aggregated)

const totalWastage = computed(() =>
  (wastageLogs.value ?? []).reduce((sum, w) => sum + w.quantity, 0),
)

const graphPoints = computed(() =>
  aggregated.value.map((row) => ({
    label: row.label,
    revenue: row.revenue,
    orderCount: row.orderCount,
  })),
)
</script>

<template>
  <div class="space-y-6">
    <PageHeader title="Analytics Dashboard" subtitle="Sales, trends, and wastage overview">
      <template #actions>
        <SelectButton
          v-model="activePeriod"
          :options="periodOptions"
          option-label="label"
          option-value="value"
          :allow-empty="false"
          size="small"
        />
      </template>
    </PageHeader>

    <AppSkeleton v-if="isPending || wastagePending" variant="kpi" :count="4" />
    <AppErrorState v-else-if="isError || wastageError" @retry="refresh" />
    <template v-else>
      <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <KpiCard
          label="Total Revenue"
          :value="formatCurrency(kpi.totalRevenue.value)"
          icon="pi-dollar"
        />
        <KpiCard label="Total Orders" :value="String(kpi.totalOrders.value)" icon="pi-receipt" />
        <KpiCard
          label="Avg Order Value"
          :value="formatCurrency(kpi.averageOrderValue.value)"
          icon="pi-chart-line"
        />
        <KpiCard
          label="Total Wastage"
          :value="`${totalWastage.toFixed(1)} units`"
          icon="pi-trash"
        />
      </div>

      <div class="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div class="xl:col-span-2">
          <DailyRevenueGraph :points="graphPoints" />
        </div>
        <TopSellingTable :sales-data="aggregated" />
      </div>

      <WastageLog :logs="wastageLogs ?? []" :ingredients="ingredients ?? []" />

      <BrandPerformance :sales-data="aggregated" />
    </template>
  </div>
</template>
