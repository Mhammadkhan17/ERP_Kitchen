<template>
  <div class="flex flex-col h-full min-h-0 bg-white rounded-xl border border-gray-200 overflow-hidden">
    <div
      class="flex items-center justify-between gap-2 px-3 py-2.5 text-white shrink-0"
      :class="headerClass"
    >
      <span class="text-xs font-semibold uppercase tracking-wider">{{ title }}</span>
      <span
        class="font-mono text-xs font-medium bg-white/20 rounded-full px-2 py-0.5 leading-none tabular-nums"
        >{{ count }}</span
      >
    </div>
    <div class="flex-1 min-h-0 overflow-hidden">
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  title: string
  headerClass: string
  count: number
}>()

defineSlots<{
  default: void
}>()
</script>
