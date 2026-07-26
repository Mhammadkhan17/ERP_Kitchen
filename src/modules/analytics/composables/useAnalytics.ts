import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query'
import { api } from '@/api/client'
import { useSnackbar } from '@/composables/useSnackbar'
import { computed } from 'vue'
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

export function useKpiMetrics() {
  const { data: sales } = useDailySales()

  const totalRevenue = computed(() =>
    (sales.value ?? []).reduce((sum, d) => sum + d.totalRevenue, 0),
  )
  const totalOrders = computed(() =>
    (sales.value ?? []).reduce((sum, d) => sum + d.orderCount, 0),
  )
  const averageOrderValue = computed(() =>
    totalOrders.value > 0 ? totalRevenue.value / totalOrders.value : 0,
  )

  return { totalRevenue, totalOrders, averageOrderValue }
}
