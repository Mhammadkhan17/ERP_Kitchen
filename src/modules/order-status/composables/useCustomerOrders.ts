import { computed, onUnmounted, type Ref } from 'vue'
import { useQuery, useQueryClient } from '@tanstack/vue-query'
import { api } from '@/api/client'
import { useSocket } from '@/composables/useSocket'
import type { Order, OrderUpdatePayload } from '@/types'

export function useCustomerOrders(inputRef: Ref<string>) {
  const queryClient = useQueryClient()
  const { socket } = useSocket()

  const isPhone = computed(() => /^\d{10}$/.test(inputRef.value))
  const isNumeric = computed(() => /^\d+$/.test(inputRef.value))

  const queryKey = computed(() => ['orders', 'customer', inputRef.value] as const)

  const query = useQuery({
    queryKey,
    queryFn: async () => {
      const val = inputRef.value
      if (isPhone.value) {
        const customers = await api.customers.list({ phone: Number(val) })
        if (!customers.length) return []
        return api.orders.list({ customerId: customers[0].id })
      }
      if (isNumeric.value) {
        return api.orders.list({ customerId: Number(val) })
      }
      return []
    },
    enabled: computed(() => !!inputRef.value),
    refetchOnWindowFocus: false,
  })

  const handler = (payload: OrderUpdatePayload) => {
    const key = queryKey.value
    if (payload.customerId == null) return
    queryClient.setQueryData<Order[]>(key, (old) => {
      if (!old) return old
      const idx = old.findIndex((o) => o.id === payload.id)
      if (idx === -1) return old
      const updated = [...old]
      updated[idx] = { ...updated[idx], status: payload.status }
      return updated
    })
  }

  socket.on('order:update', handler)
  onUnmounted(() => { socket.off('order:update', handler) })

  return query
}

export function useOrderTracking(orderNumberRef: Ref<number>) {
  const queryClient = useQueryClient()
  const { socket } = useSocket()

  const query = useQuery({
    queryKey: ['order', 'tracking', orderNumberRef] as const,
    queryFn: () =>
      api.orders.list({ orderNumber: orderNumberRef.value }).then((orders) => orders[0] ?? null),
    enabled: () => !!orderNumberRef.value && !isNaN(orderNumberRef.value),
    refetchOnWindowFocus: false,
  })

  const handler = (payload: OrderUpdatePayload) => {
    if (payload.orderNumber !== orderNumberRef.value) return
    queryClient.setQueryData<Order | null>(['order', 'tracking', orderNumberRef.value], (old) => {
      if (!old) return old
      return { ...old, status: payload.status }
    })
  }

  socket.on('order:update', handler)
  onUnmounted(() => { socket.off('order:update', handler) })

  return query
}
