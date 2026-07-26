<template>
  <div
    class="group cursor-pointer bg-white rounded-xl shadow-[0_1px_3px_0_rgba(0,0,0,0.06),0_1px_2px_0_rgba(0,0,0,0.04)] hover:shadow-[0_4px_12px_0_rgba(0,0,0,0.08)] transition-shadow duration-200 overflow-hidden relative"
    @click="$emit('view-detail', order.id)"
  >
    <div
      class="h-1.5 w-full"
      :style="{ backgroundColor: columnColor }"
    />

    <div class="p-4 space-y-3">
      <div class="flex items-center justify-between gap-2">
        <div class="flex items-center gap-2 min-w-0">
          <span
            class="font-display text-lg font-bold text-gray-900 leading-none shrink-0"
            style="font-feature-settings: 'tnum'"
          >#{{ order.orderNumber }}</span>
          <span
            class="font-mono text-xs font-medium shrink-0"
            :style="{ color: columnColor }"
          >{{ formattedTimer }}</span>
        </div>
        <span class="font-mono text-[10px] font-medium uppercase tracking-wider text-gray-400 bg-gray-100 rounded-md px-2 py-1 leading-none shrink-0">{{ order.source }}</span>
      </div>

      <div>
        <p class="text-sm font-medium text-gray-800 truncate leading-tight">{{ order.customerName }}</p>
        <p v-if="order.customerId || order.phone" class="text-[11px] text-gray-400 truncate leading-tight mt-0.5">{{ order.customerId }}{{ order.phone ? ' · ' + order.phone : '' }}</p>
      </div>

      <div class="bg-gray-50 rounded-lg p-2.5 space-y-1">
        <div
          v-for="(item, i) in visibleItems"
          :key="i"
          class="flex items-center gap-2 text-sm text-gray-700"
        >
          <span class="font-mono text-xs font-semibold text-gray-400 w-5 text-right shrink-0">{{ item.quantity }}×</span>
          <span class="truncate">{{ item.name }}</span>
        </div>
        <p v-if="extraCount > 0" class="font-mono text-[11px] text-gray-400 pl-7 italic">
          +{{ extraCount }} more
        </p>
      </div>

      <div class="pt-2 border-t border-gray-100 space-y-2">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2.5">
            <Tag v-if="actionLabel" :value="statusLabel(order.status)" :severity="tagSeverity" rounded size="small" />
            <span class="font-mono text-sm font-bold text-gray-900" style="font-feature-settings: 'tnum'">{{ formatCurrency(order.totalAmount) }}</span>
          </div>
          <Button
            icon="pi pi-eye"
            size="small"
            severity="secondary"
            text
            rounded
            class="text-gray-400 hover:text-gray-600"
            @click.stop="$emit('view-detail', order.id)"
          />
        </div>
        <Button
          v-if="actionLabel"
          :label="actionLabel"
          size="small"
          :loading="loading"
          :disabled="loading"
          class="w-full justify-center font-semibold"
          :class="order.status === 'preparing' ? 'bg-[#4A90D9] hover:bg-[#3A7BC8] border-[#4A90D9] text-white' : 'bg-gray-900 hover:bg-gray-800 border-gray-900 text-white'"
          @click.stop="handleAction"
        />
        <div
          v-else
          class="w-full rounded-lg text-xs font-semibold text-center py-2 leading-none tracking-wide uppercase"
          :class="order.status === 'cancelled' ? 'bg-red-50 text-red-500' : 'bg-gray-50 text-gray-400'"
        >{{ statusLabel(order.status) }}</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Order, OrderStatus } from '@/types'
import { useOrderFlow } from '@/modules/kds/composables/useOrderFlow'
import { formatCurrency, statusLabel } from '@/utils/formatters'
import { useTimer } from '@/composables/useTimer'
import Tag from 'primevue/tag'
import Button from 'primevue/button'

const props = defineProps<{
  order: Order
}>()

const emit = defineEmits<{
  'view-detail': [id: string]
}>()

const orderFlow = useOrderFlow()
const timer = useTimer(props.order.timestamps.placedAt)

const visibleItems = computed(() => props.order.items.slice(0, 2))
const extraCount = computed(() => Math.max(0, props.order.items.length - 2))

const formattedTimer = computed(() => timer.formatted.value)

const columnColor = computed(() => {
  const map: Record<string, string> = {
    pending: '#F4A261',
    preparing: '#4A90D9',
    ready: '#2B9348',
    dispatched: '#6C757D',
    cancelled: '#6C757D',
  }
  return map[props.order.status] || '#6C757D'
})

type ActionEntry = { label: string; handler: (id: string) => Promise<unknown> }

const actionMap: Record<OrderStatus, ActionEntry | null> = {
  pending: { label: 'Start', handler: orderFlow.startPreparing },
  preparing: { label: 'Ready', handler: orderFlow.markReady },
  ready: { label: 'Dispatch', handler: orderFlow.markDispatched },
  dispatched: null,
  cancelled: null,
}

const action = computed(() => actionMap[props.order.status])
const actionLabel = computed(() => action.value?.label ?? null)
const loading = computed(() => orderFlow.isPending.value)

function handleAction() {
  if (action.value) {
    action.value.handler(props.order.id)
  }
}

const tagSeverity = computed(() => {
  const map: Record<string, string> = {
    pending: 'warn',
    preparing: 'info',
    ready: 'success',
    dispatched: 'contrast',
    cancelled: 'danger',
  }
  return map[props.order.status] || 'info'
})
</script>
