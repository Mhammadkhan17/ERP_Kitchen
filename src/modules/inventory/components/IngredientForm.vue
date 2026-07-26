<template>
  <Dialog
    :visible="visible"
    :header="ingredient ? 'Edit Ingredient' : 'Add Ingredient'"
    :modal="true"
    :closable="false"
    :style="{ width: '520px' }"
    @update:visible="$emit('close')"
  >
    <form @submit.prevent="handleSubmit" class="flex flex-col gap-4">
      <div class="field">
        <label for="name" class="font-medium text-sm text-gray-700 mb-1 block">Name</label>
        <InputText id="name" v-model="form.name" class="w-full" :class="{ 'p-invalid': errors.name }" />
        <small v-if="errors.name" class="text-red-500">{{ errors.name }}</small>
      </div>

      <div class="grid grid-cols-2 gap-4">
        <div class="field">
          <label for="unit" class="font-medium text-sm text-gray-700 mb-1 block">Unit</label>
          <Select
            id="unit"
            v-model="form.unit"
            :options="unitOptions"
            class="w-full"
            :class="{ 'p-invalid': errors.unit }"
          />
          <small v-if="errors.unit" class="text-red-500">{{ errors.unit }}</small>
        </div>

        <div class="field">
          <label for="category" class="font-medium text-sm text-gray-700 mb-1 block">Category</label>
          <InputText id="category" v-model="form.category" class="w-full" />
        </div>
      </div>

      <div class="grid grid-cols-2 gap-4">
        <div class="field">
          <label for="currentStock" class="font-medium text-sm text-gray-700 mb-1 block">Current Stock</label>
          <InputNumber
            id="currentStock"
            v-model="form.currentStock"
            :min="0"
            :minFractionDigits="0"
            :maxFractionDigits="3"
            class="w-full"
            :class="{ 'p-invalid': errors.currentStock }"
          />
          <small v-if="errors.currentStock" class="text-red-500">{{ errors.currentStock }}</small>
        </div>

        <div class="field">
          <label for="reorderLevel" class="font-medium text-sm text-gray-700 mb-1 block">Reorder Level</label>
          <InputNumber
            id="reorderLevel"
            v-model="form.reorderLevel"
            :min="0"
            :minFractionDigits="0"
            :maxFractionDigits="3"
            class="w-full"
            :class="{ 'p-invalid': errors.reorderLevel }"
          />
          <small v-if="errors.reorderLevel" class="text-red-500">{{ errors.reorderLevel }}</small>
        </div>
      </div>

      <div class="grid grid-cols-2 gap-4">
        <div class="field">
          <label for="reorderQty" class="font-medium text-sm text-gray-700 mb-1 block">Reorder Qty</label>
          <InputNumber
            id="reorderQty"
            v-model="form.reorderQty"
            :min="0"
            :minFractionDigits="0"
            :maxFractionDigits="3"
            class="w-full"
          />
        </div>

        <div class="field">
          <label for="unitCost" class="font-medium text-sm text-gray-700 mb-1 block">Unit Cost</label>
          <InputNumber
            id="unitCost"
            v-model="form.unitCost"
            :min="0"
            :minFractionDigits="2"
            :maxFractionDigits="2"
            prefix="$"
            class="w-full"
          />
        </div>
      </div>

      <div class="field">
        <label for="supplier" class="font-medium text-sm text-gray-700 mb-1 block">Supplier</label>
        <InputText id="supplier" v-model="form.supplier" class="w-full" />
      </div>

      <div class="flex gap-2 justify-end pt-2 border-t border-gray-200">
        <Button type="button" label="Cancel" severity="secondary" @click="$emit('close')" />
        <Button type="submit" label="Save" :loading="isPending" />
      </div>
    </form>
  </Dialog>
</template>

<script setup lang="ts">
import { reactive, computed, watch } from 'vue'
import Dialog from 'primevue/dialog'
import InputText from 'primevue/inputtext'
import InputNumber from 'primevue/inputnumber'
import Select from 'primevue/select'
import Button from 'primevue/button'
import { required, positiveNumber } from '@/utils/validators'
import type { Ingredient } from '@/types'
import { useCreateIngredient, useUpdateIngredient } from '../composables/useInventory'

const props = defineProps<{
  visible: boolean
  ingredient: Ingredient | null
}>()

const emit = defineEmits<{
  close: []
  saved: []
}>()

const unitOptions = ['kg', 'g', 'L', 'mL', 'pcs']

const initialForm = () => ({
  name: '',
  unit: 'kg' as string,
  currentStock: 0,
  reorderLevel: 0,
  reorderQty: 0,
  unitCost: 0,
  supplier: '',
  category: '',
})

const form = reactive(initialForm())
const errors = reactive<Record<string, string | null>>({})

watch(() => props.visible, (val) => {
  if (val && props.ingredient) {
    Object.assign(form, {
      name: props.ingredient.name,
      unit: props.ingredient.unit,
      currentStock: props.ingredient.currentStock,
      reorderLevel: props.ingredient.reorderLevel,
      reorderQty: props.ingredient.reorderQty,
      unitCost: props.ingredient.unitCost,
      supplier: props.ingredient.supplier,
      category: props.ingredient.category,
    })
  } else if (val) {
    Object.assign(form, initialForm())
  }
  Object.keys(errors).forEach((k) => (errors[k] = null))
})

const createMutation = useCreateIngredient()
const updateMutation = useUpdateIngredient()

const isPending = computed(() => createMutation.isPending.value || updateMutation.isPending.value)

function validate(): boolean {
  let valid = true
  const fields: Record<string, unknown> = {
    name: form.name,
    unit: form.unit,
    currentStock: form.currentStock,
    reorderLevel: form.reorderLevel,
  }

  Object.entries(fields).forEach(([key, value]) => {
    const result = required(value)
    if (result !== true) {
      errors[key] = result as string
      valid = false
    } else {
      errors[key] = null
    }
  })

  const stockResult = positiveNumber(form.currentStock)
  if (stockResult !== true) {
    errors.currentStock = stockResult as string
    valid = false
  }

  const reorderResult = positiveNumber(form.reorderLevel)
  if (reorderResult !== true) {
    errors.reorderLevel = reorderResult as string
    valid = false
  }

  return valid
}

async function handleSubmit() {
  if (!validate()) return

  const payload = { ...form }

  if (props.ingredient) {
    await updateMutation.mutateAsync({ id: props.ingredient.id, data: payload })
  } else {
    await createMutation.mutateAsync(payload)
  }

  emit('saved')
}
</script>
