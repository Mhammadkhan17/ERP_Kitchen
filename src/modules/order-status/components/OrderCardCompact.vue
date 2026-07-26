<template>
  <div class="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
    <div class="flex items-center justify-between">
      <div>
        <p class="text-xs text-gray-400 uppercase tracking-wide">Order #{{ order.orderNumber }}</p>
        <p class="text-lg font-bold text-gray-900">{{ order.customerName }}</p>
        <p class="text-xs text-gray-400">{{ order.customerId }}{{ order.phone ? ' · ' + order.phone : '' }}</p>
      </div>
      <span
        class="px-2.5 py-1 rounded-full text-xs font-semibold"
        :class="statusClass"
      >{{ statusLabel }}</span>
    </div>
    <div class="text-sm text-gray-600 space-y-1">
      <p v-for="item in order.items" :key="item.menuItemId">
        {{ item.quantity }}× {{ item.name }}
      </p>
    </div>
    <div class="flex items-center justify-between pt-2 border-t border-gray-100">
      <span class="text-xs text-gray-400">{{ order.source }}</span>
      <span class="font-bold text-gray-900">${{ order.totalAmount.toFixed(2) }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Order, OrderStatus } from '@/types'

const props = defineProps<{ order: Order }>()

const statusLabel = computed(() => {
  const map: Record<OrderStatus, string> = {
    pending: 'Pending',
    preparing: 'Preparing',
    ready: 'Ready',
    dispatched: 'Dispatched',
    cancelled: 'Cancelled',
  }
  return map[props.order.status] ?? props.order.status
})

const statusClass = computed(() => {
  const map: Record<OrderStatus, string> = {
    pending: 'bg-gray-100 text-gray-600',
    preparing: 'bg-orange-100 text-orange-700',
    ready: 'bg-green-100 text-green-700',
    dispatched: 'bg-blue-100 text-blue-700',
    cancelled: 'bg-red-100 text-red-700',
  }
  return map[props.order.status] ?? 'bg-gray-100 text-gray-600'
})
</script>
