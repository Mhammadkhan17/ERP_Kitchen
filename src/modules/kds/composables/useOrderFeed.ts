import { onUnmounted } from 'vue'
import { useQueryClient } from '@tanstack/vue-query'
import { api } from '@/api/client'
import { useSocket } from '@/composables/useSocket'
import type { Order, OrderStatus } from '@/types'

export function useOrderFeed() {
  const queryClient = useQueryClient()
  const { socket, connected, error } = useSocket()

  const handler = (payload: { id: string; status: string; orderNumber?: number }) => {
    if (!payload?.id || !payload?.status) return

    queryClient.setQueryData<Order[]>(['orders'], (old) => {
      if (!old || !Array.isArray(old)) return old

      const idx = old.findIndex((o) => o.id === payload.id)
      if (idx === -1) {
        api.orders.get(payload.id).then((order) => {
          queryClient.setQueryData<Order[]>(['orders'], (prev) => {
            if (!prev) return [order]
            return [...prev, order]
          })
        }).catch(() => {
          queryClient.invalidateQueries({ queryKey: ['orders'] })
        })
        return old
      }

      const existing = old[idx]
      const updated = [...old]
      updated[idx] = { ...existing, status: payload.status as OrderStatus }
      return updated
    })
  }

  socket.on('order:update', handler)
  onUnmounted(() => { socket.off('order:update', handler) })

  return { connected, error }
}
