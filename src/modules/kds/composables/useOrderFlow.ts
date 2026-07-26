import { useMutation, useQueryClient } from '@tanstack/vue-query'
import { api } from '@/api/client'
import { useSnackbar } from '@/composables/useSnackbar'
import type { OrderStatus } from '@/types'

export function useOrderFlow() {
  const queryClient = useQueryClient()
  const snackbar = useSnackbar()

  function invalidateAll() {
    queryClient.invalidateQueries({ queryKey: ['orders'] })
    queryClient.invalidateQueries({ queryKey: ['ingredients'] })
    queryClient.invalidateQueries({ queryKey: ['analytics'] })
  }

  const updateStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: OrderStatus }) =>
      api.orders.updateStatus(id, status),
    onSuccess: (_data, { status }) => {
      invalidateAll()
      snackbar.success(`Order ${statusLabel(status)}`)
    },
    onError: () => {
      snackbar.error('Failed to update order')
    },
  })

  function startPreparing(orderId: string) {
    return updateStatus.mutateAsync({ id: orderId, status: 'preparing' })
  }

  function markReady(orderId: string) {
    return updateStatus.mutateAsync({ id: orderId, status: 'ready' })
  }

  function markDispatched(orderId: string) {
    return updateStatus.mutateAsync({ id: orderId, status: 'dispatched' })
  }

  function cancelOrder(orderId: string) {
    return updateStatus.mutateAsync({ id: orderId, status: 'cancelled' })
  }

  return {
    startPreparing,
    markReady,
    markDispatched,
    cancelOrder,
    isPending: updateStatus.isPending,
  }
}

function statusLabel(status: string): string {
  const labels: Record<string, string> = {
    preparing: 'preparation started',
    ready: 'marked ready',
    dispatched: 'dispatched',
    cancelled: 'cancelled',
  }
  return labels[status] || 'updated'
}
