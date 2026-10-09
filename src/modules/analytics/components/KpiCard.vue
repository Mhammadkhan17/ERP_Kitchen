<script setup lang="ts">
defineProps<{
  label: string
  value: string | number
  icon: string
}>()
</script>

<template>
  <div class="card flex items-start justify-between gap-4">
    <div class="flex-1 min-w-0">
      <div class="text-sm text-gray-500 font-medium truncate">{{ label }}</div>
      <div class="text-2xl font-bold text-gray-900 mt-1 font-mono tabular-nums">{{ value }}</div>
    </div>
    <i :class="`pi ${icon} text-gray-500 shrink-0`"></i>
  </div>
</template>
