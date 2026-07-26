<template>
  <div class="p-6 space-y-6">
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-4">
        <div>
          <h1 class="font-display text-xl font-bold text-gray-900 tracking-tight">Kitchen Display</h1>
          <p class="font-mono text-xs text-gray-500 mt-0.5 tracking-wide">
            {{ new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' }) }}
            <span class="mx-1.5">&middot;</span>
            <span :class="feed.connected.value ? 'text-[#2B9348]' : 'text-[#E85D3A]'">{{ feed.connected.value ? 'live' : 'offline' }}</span>
          </p>
        </div>
      </div>
      <div class="flex items-center gap-2">
        <Button
          icon="pi pi-refresh"
          severity="secondary"
          text
          rounded
          :loading="isLoading"
          @click="refresh"
        />
      </div>
    </div>

    <div class="flex gap-3">
      <IconField class="w-full max-w-sm">
        <InputIcon>
          <i class="pi pi-search" />
        </InputIcon>
        <InputText
          v-model="search"
          placeholder="Search..."
          class="w-full"
        />
      </IconField>
    </div>

    <div v-if="isError" class="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 text-sm">
      Failed to load orders. Please try again.
    </div>

    <div
      v-else-if="isLoading"
      class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4"
    >
      <div
        v-for="i in 4"
        :key="i"
        class="skeleton-card h-[400px]"
      />
    </div>

    <div
      v-else
      class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4"
    >
      <KdsColumn
        v-for="col in columns"
        :key="col.status"
        :title="col.title"
        :status="col.status"
        :orders="col.orders"
        :count="col.orders.length"
        :color="col.color"
      >
        <OrderCard
          v-for="order in col.orders"
          :key="order.id"
          :order="order"
          @view-detail="onViewDetail"
        />
      </KdsColumn>
    </div>

    <Dialog
      v-model:visible="detailVisible"
      modal
      :style="{ width: '36rem' }"
      class="rounded-xl"
    >
      <template #header>
        <div class="flex items-center gap-3">
          <span class="font-display text-xl font-bold text-[#1A1D1F]">Order #{{ detail?.orderNumber }}</span>
          <Tag
            v-if="detail"
            :value="statusLabel(detail.status)"
            :severity="severityFor(detail.status)"
            rounded
          />
        </div>
      </template>

      <div v-if="detail" class="space-y-5">
        <div class="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span class="font-mono text-[10px] uppercase tracking-wider text-[#6C757D]">Customer</span>
            <p class="font-medium text-[#1A1D1F] mt-0.5 leading-tight">{{ detail.customerName }}</p>
            <p v-if="detail.customerId || detail.phone" class="text-xs text-[#6C757D] mt-1 leading-tight">{{ detail.customerId }}{{ detail.phone ? ' · ' + detail.phone : '' }}</p>
          </div>
          <div>
            <span class="font-mono text-[10px] uppercase tracking-wider text-[#6C757D]">Source</span>
            <div class="mt-0.5">
              <Chip :label="detail.source" size="small" />
            </div>
          </div>
        </div>

        <Divider />

        <div>
          <span class="font-mono text-[10px] uppercase tracking-wider text-[#6C757D]">Items</span>
          <div class="mt-2 space-y-2">
            <div
              v-for="(item, i) in detail.items"
              :key="i"
              class="flex items-center justify-between py-1.5 border-b border-[#E9ECEF] last:border-0"
            >
              <div class="flex items-center gap-2">
                <span class="font-mono text-xs font-medium text-[#6C757D]">{{ item.quantity }}×</span>
                <span class="text-[#1A1D1F]">{{ item.name }}</span>
              </div>
              <span class="font-medium text-[#1A1D1F]">{{ formatCurrency(item.unitPrice * item.quantity) }}</span>
            </div>
          </div>
          <div
            v-if="specialItems.length > 0"
            class="mt-3 bg-amber-50 border border-amber-200 rounded-lg p-3 space-y-1"
          >
            <p
              v-for="(item, i) in specialItems"
              :key="i"
              class="text-sm text-amber-800"
            >
              <span class="font-medium">{{ item.name }}:</span> {{ item.specialInstructions }}
            </p>
          </div>
        </div>

        <Divider />

        <div class="flex items-center justify-between">
          <span class="font-mono text-[10px] uppercase tracking-wider text-[#6C757D]">Total</span>
          <span class="font-display font-bold text-lg text-[#1A1D1F]">{{ formatCurrency(detail.totalAmount) }}</span>
        </div>

        <Divider />

        <div>
          <span class="font-mono text-[10px] uppercase tracking-wider text-[#6C757D]">Timeline</span>
          <div class="mt-2 space-y-3">
            <div class="flex items-center gap-3 text-sm">
              <i class="pi pi-clock text-[#6C757D]" />
              <span class="text-[#6C757D]">Placed</span>
              <span class="ml-auto font-medium text-[#1A1D1F]">{{ formatTime(detail.timestamps.placedAt) }}</span>
            </div>
            <div
              v-if="detail.timestamps.startedAt"
              class="flex items-center gap-3 text-sm"
            >
              <i class="pi pi-play text-[#4A90D9]" />
              <span class="text-[#6C757D]">Preparation started</span>
              <span class="ml-auto font-medium text-[#1A1D1F]">{{ formatTime(detail.timestamps.startedAt) }}</span>
            </div>
            <div
              v-if="detail.timestamps.readyAt"
              class="flex items-center gap-3 text-sm"
            >
              <i class="pi pi-check-circle text-[#2B9348]" />
              <span class="text-[#6C757D]">Ready</span>
              <span class="ml-auto font-medium text-[#1A1D1F]">{{ formatTime(detail.timestamps.readyAt) }}</span>
            </div>
            <div
              v-if="detail.timestamps.dispatchedAt"
              class="flex items-center gap-3 text-sm"
            >
              <i class="pi pi-truck text-[#6C757D]" />
              <span class="text-[#6C757D]">Dispatched</span>
              <span class="ml-auto font-medium text-[#1A1D1F]">{{ formatTime(detail.timestamps.dispatchedAt) }}</span>
            </div>
          </div>
        </div>
      </div>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useQuery } from '@tanstack/vue-query'
import { api } from '@/api/client'
import type { Order, OrderStatus } from '@/types'
import { formatCurrency, formatTime, statusLabel } from '@/utils/formatters'
import { useOrderFeed } from '@/modules/kds/composables/useOrderFeed'
import KdsColumn from '@/modules/kds/components/KdsColumn.vue'
import OrderCard from '@/modules/kds/components/OrderCard.vue'
import Dialog from 'primevue/dialog'
import Chip from 'primevue/chip'
import Divider from 'primevue/divider'
import Tag from 'primevue/tag'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import IconField from 'primevue/iconfield'
import InputIcon from 'primevue/inputicon'

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
    { title: 'Pending', status: 'pending' as OrderStatus, orders: all.filter((o) => o.status === 'pending'), color: '#F4A261' },
    { title: 'Preparing', status: 'preparing' as OrderStatus, orders: all.filter((o) => o.status === 'preparing'), color: '#4A90D9' },
    { title: 'Ready', status: 'ready' as OrderStatus, orders: all.filter((o) => o.status === 'ready'), color: '#2B9348' },
    { title: 'Dispatched', status: 'dispatched' as OrderStatus, orders: all.filter((o) => o.status === 'dispatched' || o.status === 'cancelled'), color: '#6C757D' },
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

function severityFor(status: OrderStatus): string {
  const map: Record<string, string> = {
    pending: 'warn',
    preparing: 'info',
    ready: 'success',
    dispatched: 'contrast',
    cancelled: 'danger',
  }
  return map[status] || 'info'
}
</script>
