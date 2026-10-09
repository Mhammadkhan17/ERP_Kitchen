<template>
  <IconField class="w-full">
    <InputIcon class="pi pi-search" />
    <InputText :model-value="model" class="w-full" :placeholder="placeholder" @update:model-value="onInput" />
  </IconField>
</template>

<script setup lang="ts">
import IconField from 'primevue/iconfield'
import InputIcon from 'primevue/inputicon'
import InputText from 'primevue/inputtext'

defineProps<{ placeholder?: string }>()
const model = defineModel<string>({ default: '' })

function onInput(v: unknown) {
  model.value = typeof v === 'string' ? v : String(v ?? '')
}
</script>
