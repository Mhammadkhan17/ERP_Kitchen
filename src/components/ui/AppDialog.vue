<template>
  <Dialog
    :style="{ width: WIDTH[size] }"
    :pt="{ root: { class: 'rounded-xl' }, header: { class: 'px-6 py-5 border-b border-gray-200' }, content: { class: 'p-6' }, footer: { class: 'px-6 py-4 border-t border-gray-200 flex justify-end gap-2' } }"
    v-bind="$attrs"
  >
    <template v-for="(_, name) in $slots" #[name]="slotData">
      <slot :name="name" v-bind="slotData ?? {}" />
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import Dialog from 'primevue/dialog'

withDefaults(defineProps<{ size?: 'sm' | 'md' | 'lg' }>(), { size: 'md' })

const WIDTH = { sm: '24rem', md: '32rem', lg: '40rem' } as const
</script>
