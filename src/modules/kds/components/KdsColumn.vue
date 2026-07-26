<template>
  <div class="flex flex-col">
    <div class="relative flex items-center gap-3 px-1 pb-3">
      <div class="flex items-center gap-2.5">
        <div
          class="w-2.5 h-2.5 rounded-full shrink-0"
          :style="{ backgroundColor: color }"
        />
        <span
          class="font-display text-xs font-medium uppercase tracking-[0.08em]"
          :style="{ color: color }"
        >{{ title }}</span>
      </div>
      <span
        class="font-mono text-[10px] font-medium text-gray-500 bg-gray-200 rounded-full px-2 py-0.5 leading-none"
      >{{ count }}</span>
    </div>
    <div
      class="flex-1 overflow-y-auto space-y-3 min-h-[300px] max-h-[calc(100vh-14rem)] rounded-xl"
      :style="{
        border: '1px solid ' + color + '20',
        background: 'linear-gradient(180deg, ' + color + '04 0%, transparent 8px)',
      }"
    >
      <div class="p-3 space-y-3">
        <slot />
        <div
          v-if="!$slots.default"
          class="flex items-center justify-center h-32 font-mono text-xs text-[#6C757D] tracking-wide"
        >
          no tickets
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Order } from '@/types'

defineProps<{
  title: string
  status: string
  orders: Order[]
  count: number
  color: string
}>()

defineSlots<{
  default: void
}>()
</script>
