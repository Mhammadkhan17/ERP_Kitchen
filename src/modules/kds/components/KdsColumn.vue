<template>
  <div class="flex flex-col">
    <div class="flex items-center gap-3 px-1 pb-3">
      <div class="flex items-center gap-2.5">
        <span class="w-2.5 h-2.5 rounded-full shrink-0" :class="spineClass" />
        <span class="font-display text-xs font-medium" :class="titleClass">{{ title }}</span>
      </div>
      <span
        class="font-mono text-xs font-medium text-gray-500 bg-gray-200 rounded-full px-2 py-0.5 leading-none"
        >{{ count }}</span
      >
    </div>
    <div
      class="flex-1 overflow-y-auto space-y-3 min-h-[300px] max-h-[calc(100vh-14rem)] rounded-xl border border-gray-200 bg-white"
    >
      <div class="p-3 space-y-3">
        <slot />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { ORDER_STATUS_TEXT_CLASS } from '@/constants/orderStatus'
import type { Order, OrderStatus } from '@/types'

const props = defineProps<{
  title: string
  status: OrderStatus
  orders: Order[]
  count: number
  spineClass: string
}>()

defineSlots<{
  default: void
}>()

const titleClass = computed(() => ORDER_STATUS_TEXT_CLASS[props.status] ?? 'text-gray-600')
</script>
