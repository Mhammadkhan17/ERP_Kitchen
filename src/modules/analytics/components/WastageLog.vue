<script setup lang="ts">
import { ref, computed } from 'vue'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import Select from 'primevue/select'
import InputNumber from 'primevue/inputnumber'
import InputText from 'primevue/inputtext'
import { formatDate } from '@/utils/formatters'
import { useCreateWastage } from '@/modules/analytics/composables/useAnalytics'
import type { WastageLog, Ingredient } from '@/types'

const props = defineProps<{
  logs: WastageLog[]
  ingredients: Ingredient[]
}>()

const createWastage = useCreateWastage()

const dialogVisible = ref(false)
const form = ref({
  ingredientId: '',
  quantity: 0,
  unit: '',
  reason: '',
})

const ingredientOptions = computed(() =>
  props.ingredients.map((i) => ({ label: i.name, value: i.id })),
)

function ingredientName(id: string) {
  return props.ingredients.find((i) => i.id === id)?.name ?? id
}

function openDialog() {
  form.value = { ingredientId: '', quantity: 0, unit: '', reason: '' }
  dialogVisible.value = true
}

function submitWastage() {
  if (!form.value.ingredientId || form.value.quantity <= 0) return
  createWastage.mutate(
    {
      date: new Date().toISOString(),
      ingredientId: form.value.ingredientId,
      quantity: form.value.quantity,
      unit: form.value.unit,
      reason: form.value.reason,
    },
    { onSuccess: () => { dialogVisible.value = false } },
  )
}
</script>

<template>
  <div class="card">
    <div class="flex items-center justify-between mb-4">
      <h3 class="text-base font-semibold text-gray-900">Wastage Log</h3>
      <Button label="Log Wastage" icon="pi pi-plus" size="small" class="btn-primary" @click="openDialog" />
    </div>

    <DataTable
      :value="logs"
      striped-rows
      size="small"
      scrollable
      scroll-height="400px"
      class="text-sm"
    >
      <Column field="date" header="Date">
        <template #body="{ data }">
          {{ formatDate(data.date) }}
        </template>
      </Column>
      <Column header="Ingredient">
        <template #body="{ data }">
          {{ ingredientName(data.ingredientId) }}
        </template>
      </Column>
      <Column field="quantity" header="Qty" />
      <Column field="unit" header="Unit" />
      <Column field="reason" header="Reason" />
    </DataTable>

    <div v-if="!logs.length" class="text-center text-gray-400 py-6 text-sm">
      No wastage records
    </div>

    <Dialog
      v-model:visible="dialogVisible"
      header="Log Wastage"
      :modal="true"
      class="w-full max-w-md"
    >
      <div class="flex flex-col gap-4">
        <div class="flex flex-col gap-1.5">
          <label class="text-sm font-medium text-gray-700">Ingredient</label>
          <Select
            v-model="form.ingredientId"
            :options="ingredientOptions"
            option-label="label"
            option-value="value"
            placeholder="Select ingredient"
            class="w-full"
          />
        </div>
        <div class="flex flex-col gap-1.5">
          <label class="text-sm font-medium text-gray-700">Quantity</label>
          <InputNumber
            v-model="form.quantity"
            :min="0"
            :step="0.1"
            placeholder="0"
            class="w-full"
          />
        </div>
        <div class="flex flex-col gap-1.5">
          <label class="text-sm font-medium text-gray-700">Unit</label>
          <InputText
            v-model="form.unit"
            placeholder="e.g. kg, liters, pieces"
          />
        </div>
        <div class="flex flex-col gap-1.5">
          <label class="text-sm font-medium text-gray-700">Reason</label>
          <InputText
            v-model="form.reason"
            placeholder="Why was this wasted?"
          />
        </div>
      </div>
      <template #footer>
        <Button label="Cancel" severity="secondary" class="btn-secondary" @click="dialogVisible = false" />
        <Button
          label="Submit"
          class="btn-primary"
          :loading="createWastage.isPending.value"
          :disabled="!form.ingredientId || form.quantity <= 0"
          @click="submitWastage"
        />
      </template>
    </Dialog>
  </div>
</template>
