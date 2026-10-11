import { ref, computed } from 'vue'
import { useQuery } from '@tanstack/vue-query'
import { api } from '@/api/client'
import { useOrderFeed } from './useOrderFeed'
import { ORDER_STATUS_HEADER_CLASS } from '@/constants/orderStatus'
import type { Order, OrderStatus } from '@/types'

export function useOrderDashboard() {
  const feed = useOrderFeed()

  const {
    data: orders,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['orders'],
    queryFn: () => api.orders.list() as Promise<Order[]>,
    refetchInterval: 30_000,
  })

  function refresh() {
    refetch()
  }

  const search = ref('')

  const filteredOrders = computed(() => {
    const all = orders.value ?? []
    if (!search.value.trim()) return all
    const q = search.value.trim().toLowerCase()
    return all.filter((o) => {
      const nameMatch = o.customerName.toLowerCase().includes(q)
      const numMatch = String(o.orderNumber).includes(q)
      const idMatch = o.customerId != null && String(o.customerId).includes(q)
      const phoneMatch = o.phone != null && String(o.phone).includes(q)
      const sourceMatch = o.source.toLowerCase().includes(q)
      const itemMatch = o.items.some((i) => i.name.toLowerCase().includes(q))
      return nameMatch || numMatch || idMatch || phoneMatch || sourceMatch || itemMatch
    })
  })

  const columns = computed(() => {
    const all = filteredOrders.value
    return [
      {
        title: 'pending',
        status: 'pending' as OrderStatus,
        orders: all.filter((o) => o.status === 'pending'),
        headerClass: ORDER_STATUS_HEADER_CLASS.pending,
      },
      {
        title: 'preparing',
        status: 'preparing' as OrderStatus,
        orders: all.filter((o) => o.status === 'preparing'),
        headerClass: ORDER_STATUS_HEADER_CLASS.preparing,
      },
      {
        title: 'ready',
        status: 'ready' as OrderStatus,
        orders: all.filter((o) => o.status === 'ready'),
        headerClass: ORDER_STATUS_HEADER_CLASS.ready,
      },
      {
        title: 'dispatched',
        status: 'dispatched' as OrderStatus,
        orders: all.filter((o) => o.status === 'dispatched' || o.status === 'cancelled'),
        headerClass: ORDER_STATUS_HEADER_CLASS.dispatched,
      },
    ]
  })

  const selectedOrderId = ref<string | null>(null)
  const detailVisible = ref(false)

  const detail = computed(() => {
    if (!selectedOrderId.value) return null
    return (orders.value ?? []).find((o) => o.id === selectedOrderId.value) ?? null
  })

  function onViewDetail(id: string) {
    selectedOrderId.value = id
    detailVisible.value = true
  }

  const specialItems = computed(() => {
    return (detail.value?.items ?? []).filter((i) => i.specialInstructions)
  })

  return {
    feed,
    isLoading,
    isError,
    search,
    columns,
    detail,
    detailVisible,
    specialItems,
    onViewDetail,
    refresh,
  }
}
