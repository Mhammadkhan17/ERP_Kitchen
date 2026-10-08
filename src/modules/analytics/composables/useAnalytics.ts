import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query'
import { api } from '@/api/client'
import { useSnackbar } from '@/composables/useSnackbar'
import { computed, toValue, type MaybeRefOrGetter } from 'vue'
import { aggregateSales, type AggregatedPeriod, type SalesPeriod } from '@/utils/aggregateSales'
import type { WastageLog } from '@/types'

export function useDailySales() {
  return useQuery({
    queryKey: ['analytics', 'sales'],
    queryFn: () => api.analytics.sales.list(),
  })
}

export function useWastageLogs() {
  return useQuery({
    queryKey: ['analytics', 'wastage'],
    queryFn: () => api.analytics.wastage.list(),
  })
}

export function useCreateWastage() {
  const qc = useQueryClient()
  const snackbar = useSnackbar()
  return useMutation({
    mutationFn: (data: Partial<WastageLog>) => api.analytics.wastage.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['analytics', 'wastage'] })
      snackbar.success('Wastage logged')
    },
    onError: () => snackbar.error('Failed to log wastage'),
  })
}

export function useAggregatedSales(period: MaybeRefOrGetter<SalesPeriod>) {
  const { data: sales, isPending } = useDailySales()
  const aggregated = computed(() => aggregateSales(sales.value ?? [], toValue(period)))
  return { aggregated, isPending }
}

export function useKpiMetrics(rows: MaybeRefOrGetter<AggregatedPeriod[]>) {
  const data = computed(() => toValue(rows))

  const totalRevenue = computed(() =>
    data.value.reduce((sum, d) => sum + d.revenue, 0),
  )
  const totalOrders = computed(() =>
    data.value.reduce((sum, d) => sum + d.orderCount, 0),
  )
  const averageOrderValue = computed(() =>
    totalOrders.value > 0 ? totalRevenue.value / totalOrders.value : 0,
  )

  return { totalRevenue, totalOrders, averageOrderValue }
}
