<template>
  <div class="space-y-6">
    <PageHeader title="Kitchen display" subtitle="Live orders">
      <template #actions>
        <span
          class="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium"
          :class="isLive ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'"
        >
          <span class="w-1.5 h-1.5 rounded-full" :class="isLive ? 'bg-green-600' : 'bg-red-600'" />
          {{ isLive ? 'Live' : 'Disconnected' }}
        </span>
        <Button
          icon="pi pi-refresh"
          severity="secondary"
          outlined
          :loading="isLoading"
          aria-label="Refresh"
          @click="refresh"
        />
      </template>
    </PageHeader>

    <div class="flex gap-3">
      <AppSearchInput v-model="search" placeholder="Search orders..." class="w-full max-w-sm" />
    </div>

    <AppSkeleton v-if="isLoading" variant="cards" :count="4" />
    <AppErrorState v-else-if="isError" @retry="refresh" />
    <div v-else class="grid gap-4 grid-cols-1 md:grid-cols-2 xl:grid-cols-4 h-[calc(100vh-14rem)]">
      <KdsColumn
        v-for="col in columns"
        :key="col.status"
        :title="col.title"
        :header-class="col.headerClass"
        :count="col.orders.length"
      >
        <AppEmptyState v-if="!col.orders.length" title="No orders" class="h-full" />
        <VirtualScroller
          v-else
          :items="col.orders"
          :item-size="ORDER_CARD_ITEM_SIZE"
          orientation="vertical"
          class="h-full w-full overflow-x-hidden"
        >
          <template #item="{ item }">
            <div class="w-full box-border px-3 pt-3 overflow-hidden">
              <OrderCard :order="item" @view-detail="onViewDetail" />
            </div>
          </template>
        </VirtualScroller>
      </KdsColumn>
    </div>

    <AppDialog v-model:visible="detailVisible" modal size="lg">
      <template #header>
        <div class="flex items-center gap-3">
          <span class="text-lg font-semibold text-gray-900">Order #{{ detail?.orderNumber }}</span>
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
            <span class="font-mono text-xs uppercase tracking-wider text-gray-500">Customer</span>
            <p class="font-medium text-gray-900 mt-0.5 leading-tight">{{ detail.customerName }}</p>
            <p
              v-if="detail.customerId || detail.phone"
              class="text-xs text-gray-500 mt-1 leading-tight"
            >
              {{ detail.customerId }}{{ detail.phone ? ' · ' + detail.phone : '' }}
            </p>
          </div>
          <div>
            <span class="font-mono text-xs uppercase tracking-wider text-gray-500">Source</span>
            <div class="mt-0.5">
              <Chip :label="detail.source" size="small" />
            </div>
          </div>
        </div>

        <Divider />

        <div>
          <span class="font-mono text-xs uppercase tracking-wider text-gray-500">Items</span>
          <div class="mt-2 space-y-2">
            <div
              v-for="(item, i) in detail.items"
              :key="i"
              class="flex items-center justify-between py-1.5 border-b border-gray-200 last:border-0"
            >
              <div class="flex items-center gap-2">
                <span class="font-mono text-xs font-medium text-gray-500"
                  >{{ item.quantity }}×</span
                >
                <span class="text-gray-900">{{ item.name }}</span>
              </div>
              <span class="font-medium text-gray-900">{{
                formatCurrency(item.unitPrice * item.quantity)
              }}</span>
            </div>
          </div>
          <div v-if="specialItems.length > 0" class="mt-3 space-y-2">
            <Message v-for="(item, i) in specialItems" :key="i" severity="warn" class="w-full">
              <span class="font-medium">{{ item.name }}:</span>
              {{ item.specialInstructions }}
            </Message>
          </div>
        </div>

        <Divider />

        <div class="flex items-center justify-between">
          <span class="font-mono text-xs uppercase tracking-wider text-gray-500">Total</span>
          <span class="font-display font-bold text-lg text-gray-900">{{
            formatCurrency(detail.totalAmount)
          }}</span>
        </div>

        <Divider />

        <div>
          <span class="font-mono text-xs uppercase tracking-wider text-gray-500">Timeline</span>
          <div class="mt-2 space-y-3">
            <div class="flex items-center gap-3 text-sm">
              <i class="pi pi-clock text-gray-500" />
              <span class="text-gray-500">Placed</span>
              <span class="ml-auto font-medium text-gray-900">{{
                formatTime(detail.timestamps.placedAt)
              }}</span>
            </div>
            <div v-if="detail.timestamps.startedAt" class="flex items-center gap-3 text-sm">
              <i class="pi pi-play text-blue-600" />
              <span class="text-gray-500">Preparation started</span>
              <span class="ml-auto font-medium text-gray-900">{{
                formatTime(detail.timestamps.startedAt)
              }}</span>
            </div>
            <div v-if="detail.timestamps.readyAt" class="flex items-center gap-3 text-sm">
              <i class="pi pi-check-circle text-green-600" />
              <span class="text-gray-500">Ready</span>
              <span class="ml-auto font-medium text-gray-900">{{
                formatTime(detail.timestamps.readyAt)
              }}</span>
            </div>
            <div v-if="detail.timestamps.dispatchedAt" class="flex items-center gap-3 text-sm">
              <i class="pi pi-truck text-gray-500" />
              <span class="text-gray-500">Dispatched</span>
              <span class="ml-auto font-medium text-gray-900">{{
                formatTime(detail.timestamps.dispatchedAt)
              }}</span>
            </div>
          </div>
        </div>
      </div>

      <template #footer>
        <Button
          v-if="detailCta"
          :label="detailCta.label"
          :severity="detailCta.severity"
          size="large"
          :loading="isActionPending"
          :disabled="isActionPending"
          class="min-h-[44px] px-8 font-semibold"
          @click="handleDetailAction"
        />
      </template>
    </AppDialog>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { formatCurrency, statusLabel, formatTime } from '@/utils/formatters'
import { ORDER_STATUS_CTA, ORDER_STATUS_SEVERITY } from '@/constants/orderStatus'
import type { OrderStatus } from '@/types'
import { useOrderDashboard } from '@/modules/kds/composables/useOrderDashboard'
import { useOrderFlow } from '@/modules/kds/composables/useOrderFlow'
import KdsColumn from '@/modules/kds/components/KdsColumn.vue'
import OrderCard from '@/modules/kds/components/OrderCard.vue'
import PageHeader from '@/components/ui/PageHeader.vue'
import AppSearchInput from '@/components/ui/AppSearchInput.vue'
import AppSkeleton from '@/components/ui/AppSkeleton.vue'
import AppErrorState from '@/components/ui/AppErrorState.vue'
import AppEmptyState from '@/components/ui/AppEmptyState.vue'
import AppDialog from '@/components/ui/AppDialog.vue'
import Chip from 'primevue/chip'
import Divider from 'primevue/divider'
import Message from 'primevue/message'
import Tag from 'primevue/tag'
import Button from 'primevue/button'
import VirtualScroller from 'primevue/virtualscroller'

const ORDER_CARD_ITEM_SIZE = 292

const {
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
} = useOrderDashboard()

const orderFlow = useOrderFlow()

const isLive = computed(() => feed.connected.value)

const detailCta = computed(() =>
  detail.value ? (ORDER_STATUS_CTA[detail.value.status] ?? null) : null,
)

const isActionPending = computed(() => orderFlow.isPending.value)

function severityFor(status: OrderStatus): string {
  return ORDER_STATUS_SEVERITY[status] || 'info'
}

function handleDetailAction() {
  if (!detail.value || !detailCta.value) return
  const id = detail.value.id
  switch (detail.value.status) {
    case 'pending':
      orderFlow.startPreparing(id)
      break
    case 'preparing':
      orderFlow.markReady(id)
      break
    case 'ready':
      orderFlow.markDispatched(id)
      break
  }
}
</script>
