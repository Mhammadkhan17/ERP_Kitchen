<template>
  <div
    class="group cursor-pointer bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-150 overflow-hidden relative min-h-[44px]"
    @click="$emit('view-detail', order.id)"
  >
    <div class="h-1 w-full" :class="ORDER_STATUS_SPINE_CLASS[order.status] ?? 'bg-gray-400'" />

    <div class="p-4 space-y-3">
      <div class="flex items-center justify-between gap-2">
        <div class="flex items-center gap-2 min-w-0">
          <span class="font-mono text-lg font-bold text-gray-900 tabular-nums leading-none shrink-0"
            >#{{ order.orderNumber }}</span
          >
          <span
            class="font-mono text-xs font-medium shrink-0 tabular-nums"
            :class="TIMER_TIER_CLASS[timerTier(elapsedMinutes)]"
            >{{ formattedTimer }}</span
          >
        </div>
        <span
          class="font-mono text-xs font-medium uppercase tracking-wider text-gray-400 bg-gray-100 rounded-md px-2 py-1 leading-none shrink-0"
          >{{ order.source }}</span
        >
      </div>

      <div>
        <p class="text-sm font-medium text-gray-800 truncate leading-tight">
          {{ order.customerName }}
        </p>
        <p
          v-if="order.customerId || order.phone"
          class="text-xs text-gray-500 truncate leading-tight mt-0.5"
        >
          {{ order.customerId }}{{ order.phone ? ' · ' + order.phone : '' }}
        </p>
      </div>

      <div class="bg-gray-50 rounded-lg p-2.5 space-y-1">
        <div
          v-for="(item, i) in visibleItems"
          :key="i"
          class="flex items-center gap-2 text-sm text-gray-700"
        >
          <span class="font-mono text-xs font-semibold text-gray-400 w-5 text-right shrink-0"
            >{{ item.quantity }}×</span
          >
          <span class="truncate">{{ item.name }}</span>
        </div>
        <p v-if="extraCount > 0" class="font-mono text-xs text-gray-400 pl-7 italic">
          +{{ extraCount }} more
        </p>
      </div>

      <div class="pt-2 border-t border-gray-100 space-y-2">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2.5">
            <Tag
              v-if="cta"
              :value="statusLabel(order.status)"
              :severity="tagSeverity"
              rounded
              size="small"
            />
            <span class="font-mono text-sm font-bold text-gray-900 tabular-nums">{{
              formatCurrency(order.totalAmount)
            }}</span>
          </div>
          <Button
            icon="pi pi-eye"
            size="small"
            severity="secondary"
            text
            rounded
            aria-label="View details"
            class="text-gray-400 hover:text-gray-600"
            @click.stop="$emit('view-detail', order.id)"
          />
        </div>
        <Button
          v-if="cta"
          :label="cta.label"
          :severity="cta.severity"
          size="large"
          :loading="loading"
          :disabled="loading"
          class="w-full justify-center font-semibold min-h-[44px]"
          @click.stop="handleAction"
        />
        <div
          v-else
          class="w-full rounded-lg text-xs font-semibold text-center py-2 leading-none tracking-wide uppercase bg-gray-50"
          :class="ORDER_STATUS_TEXT_CLASS[order.status] ?? 'text-gray-400'"
        >
          {{ statusLabel(order.status) }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Order } from '@/types'
import { useOrderFlow } from '@/modules/kds/composables/useOrderFlow'
import { formatCurrency, statusLabel } from '@/utils/formatters'
import {
  ORDER_STATUS_CTA,
  ORDER_STATUS_SEVERITY,
  ORDER_STATUS_SPINE_CLASS,
  ORDER_STATUS_TEXT_CLASS,
  TIMER_TIER_CLASS,
  timerTier,
} from '@/constants/orderStatus'
import { useTimer } from '@/composables/useTimer'
import Tag from 'primevue/tag'
import Button from 'primevue/button'

const props = defineProps<{
  order: Order
}>()

defineEmits<{
  'view-detail': [id: string]
}>()

const orderFlow = useOrderFlow()
const timer = useTimer(props.order.timestamps.placedAt)

const visibleItems = computed(() => props.order.items.slice(0, 2))
const extraCount = computed(() => Math.max(0, props.order.items.length - 2))

const formattedTimer = computed(() => timer.formatted.value)
const elapsedMinutes = computed(() => timer.elapsed.value / 60)

const cta = computed(() => ORDER_STATUS_CTA[props.order.status] ?? null)
const action = computed(() => {
  switch (props.order.status) {
    case 'pending':
      return orderFlow.startPreparing
    case 'preparing':
      return orderFlow.markReady
    case 'ready':
      return orderFlow.markDispatched
    default:
      return null
  }
})
const loading = computed(() => orderFlow.isPending.value)

function handleAction() {
  action.value?.(props.order.id)
}

const tagSeverity = computed(() => ORDER_STATUS_SEVERITY[props.order.status] || 'info')
</script>
