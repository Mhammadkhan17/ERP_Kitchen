<template>
  <div class="max-w-xl mx-auto flex flex-col gap-6">
    <div class="flex items-center gap-3">
      <Button icon="pi pi-arrow-left" severity="secondary" text rounded @click="$router.push('/inventory')" />
      <h1 class="text-2xl font-bold text-gray-900">Stock Adjustment</h1>
    </div>

    <div class="card bg-white rounded-lg border border-gray-200 p-6 flex flex-col gap-5">
      <div class="field">
        <label for="ingredient" class="font-medium text-sm text-gray-700 mb-1 block">Ingredient</label>
        <Select
          id="ingredient"
          v-model="selectedIngredient"
          :options="ingredients ?? []"
          optionLabel="name"
          placeholder="Select an ingredient"
          class="w-full"
          :class="{ 'p-invalid': error }"
        />
      </div>

      <template v-if="selectedIngredient">
        <div class="bg-gray-50 rounded-lg p-4 flex items-center justify-between">
          <span class="text-sm text-gray-600">Current Stock</span>
          <span class="text-lg font-bold">
            {{ selectedIngredient.currentStock }}
            <span class="text-sm font-normal text-gray-500">{{ selectedIngredient.unit }}</span>
          </span>
        </div>

        <div class="field">
          <label class="font-medium text-sm text-gray-700 mb-2 block">Adjustment Type</label>
          <div class="flex gap-2">
            <Button
              :severity="adjustmentType === 'in' ? 'primary' : 'secondary'"
              :outlined="adjustmentType !== 'in'"
              label="Stock In"
              icon="pi pi-plus-circle"
              @click="adjustmentType = 'in'"
            />
            <Button
              :severity="adjustmentType === 'out' ? 'danger' : 'secondary'"
              :outlined="adjustmentType !== 'out'"
              label="Stock Out"
              icon="pi pi-minus-circle"
              @click="adjustmentType = 'out'"
            />
          </div>
        </div>

        <div class="field">
          <label for="quantity" class="font-medium text-sm text-gray-700 mb-1 block">Quantity</label>
          <InputNumber
            id="quantity"
            v-model="quantity"
            :min="0"
            :minFractionDigits="0"
            :maxFractionDigits="3"
            class="w-full"
            :class="{ 'p-invalid': qtyError }"
          />
          <small v-if="qtyError" class="text-red-500">{{ qtyError }}</small>
        </div>

        <div class="field">
          <label for="reason" class="font-medium text-sm text-gray-700 mb-1 block">Reason</label>
          <Textarea
            id="reason"
            v-model="reason"
            rows="2"
            placeholder="e.g. Supplier delivery, spoilage, etc."
            class="w-full"
          />
        </div>

        <div
          v-if="quantity > 0"
          class="bg-orange-50 border border-orange-200 rounded-lg p-3 text-sm text-orange-800"
        >
          New stock will be: <strong>{{ newStockPreview }}</strong>
          <span class="text-orange-600"> {{ selectedIngredient.unit }}</span>
        </div>

        <Button
          label="Submit Adjustment"
          icon="pi pi-check"
          class="w-full"
          :loading="isPending"
          @click="handleSubmit"
        />
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import Button from 'primevue/button'
import Select from 'primevue/select'
import InputNumber from 'primevue/inputnumber'
import Textarea from 'primevue/textarea'
import { positiveNumber } from '@/utils/validators'
import type { Ingredient } from '@/types'
import { useIngredients, useAdjustStock } from '../composables/useInventory'

const router = useRouter()

const { data: ingredients } = useIngredients()
const adjustMutation = useAdjustStock()

const selectedIngredient = ref<Ingredient | null>(null)
const adjustmentType = ref<'in' | 'out'>('in')
const quantity = ref<number>(0)
const reason = ref('')
const qtyError = ref<string | null>(null)
const error = ref(false)

const isPending = computed(() => adjustMutation.isPending.value)

const delta = computed(() => {
  const q = quantity.value || 0
  return adjustmentType.value === 'in' ? q : -q
})

const newStockPreview = computed(() => {
  if (!selectedIngredient.value) return 0
  return Math.max(0, +(selectedIngredient.value.currentStock + delta.value).toFixed(3))
})

async function handleSubmit() {
  qtyError.value = null
  error.value = false

  if (!selectedIngredient.value) {
    error.value = true
    return
  }

  const validation = positiveNumber(quantity.value)
  if (validation !== true) {
    qtyError.value = validation as string
    return
  }

  if (!reason.value.trim()) {
    qtyError.value = 'Reason is required'
    return
  }

  await adjustMutation.mutateAsync({
    id: selectedIngredient.value.id,
    delta: delta.value,
    reason: reason.value,
  })

  selectedIngredient.value = null
  quantity.value = 0
  reason.value = ''
  adjustmentType.value = 'in'
}
</script>
