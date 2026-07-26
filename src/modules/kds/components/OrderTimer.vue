<template>
  <span
    class="font-mono text-sm tabular-nums"
    :class="{
      'text-red-500': timer.isUrgent.value,
      'text-yellow-500': !timer.isUrgent.value && timer.isWarning.value,
    }"
  >
    {{ timer.formatted.value }}
  </span>
</template>

<script setup lang="ts">
import { useTimer } from '@/composables/useTimer'

const props = defineProps<{
  placedAt: string
}>()

const timer = useTimer(props.placedAt)
</script>
