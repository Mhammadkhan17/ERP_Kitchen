<template>
  <div class="flex flex-col gap-2">
    <span class="p-input-icon-left w-full">
      <i class="pi pi-search" />
      <InputText
        v-model="search"
        placeholder="Search ingredients..."
        class="w-full"
      />
    </span>

    <div v-if="filteredIngredients.length === 0" class="text-gray-400 text-sm p-2">
      No ingredients found
    </div>

    <div
      v-for="ing in filteredIngredients"
      :key="ing.id"
      class="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors"
    >
      <Checkbox
        :input-id="ing.id"
        :binary="true"
        :model-value="isSelected(ing.id)"
        @update:model-value="toggleIngredient(ing.id)"
      />
      <label :for="ing.id" class="flex-1 text-sm cursor-pointer">{{ ing.name }}</label>
      <span class="text-xs text-gray-400 w-16 text-right">{{ ing.unit }}</span>
      <InputNumber
        v-if="isSelected(ing.id)"
        :model-value="getQuantity(ing.id)"
        @update:model-value="updateQuantity(ing.id, $event)"
        :min="0"
        :step="0.5"
        :max-fraction-digits="2"
        :input-style="{ width: '80px' }"
        placeholder="Qty"
        size="small"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import InputText from 'primevue/inputtext'
import InputNumber from 'primevue/inputnumber'
import Checkbox from 'primevue/checkbox'
import { useIngredients } from '@/modules/inventory/composables/useInventory'
import type { RecipeIngredient } from '@/types'

const props = defineProps<{
  selected: RecipeIngredient[]
  menuItemId: string
}>()

const emit = defineEmits<{
  'update:selected': [value: RecipeIngredient[]]
}>()

const search = ref('')

const { data: ingredients } = useIngredients()

const filteredIngredients = computed(() => {
  const list = ingredients.value ?? []
  if (!search.value) return list
  const q = search.value.toLowerCase()
  return list.filter((i) => i.name.toLowerCase().includes(q))
})

function isSelected(ingredientId: string): boolean {
  return props.selected.some((s) => s.ingredientId === ingredientId)
}

function getQuantity(ingredientId: string): number {
  return props.selected.find((s) => s.ingredientId === ingredientId)?.quantity ?? 1
}

function toggleIngredient(ingredientId: string) {
  if (isSelected(ingredientId)) {
    emit('update:selected', props.selected.filter((s) => s.ingredientId !== ingredientId))
  } else {
    emit('update:selected', [...props.selected, { ingredientId, quantity: 1 }])
  }
}

function updateQuantity(ingredientId: string, qty: number | null) {
  const q = qty ?? 0
  emit(
    'update:selected',
    props.selected.map((s) => (s.ingredientId === ingredientId ? { ...s, quantity: q } : s)),
  )
}
</script>
