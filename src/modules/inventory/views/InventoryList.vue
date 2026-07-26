<template>
  <div class="flex flex-col gap-4">
    <div class="flex items-center justify-between">
      <h1 class="text-2xl font-bold text-gray-900">Inventory</h1>
      <div class="flex items-center gap-2">
        <Button
          label="Stock Adjustment"
          severity="secondary"
          icon="pi pi-refresh"
          @click="$router.push('/inventory/adjust')"
        />
        <Button label="Add Ingredient" icon="pi pi-plus" @click="openCreate" />
      </div>
    </div>

    <LowStockBanner v-if="ingredients" :ingredients="ingredients" />

    <div class="flex items-center gap-3">
      <IconField iconPosition="left" class="flex-1">
        <InputIcon class="pi pi-search" />
        <InputText
          v-model="search"
          placeholder="Search ingredients..."
          class="w-full"
        />
      </IconField>
      <Select
        v-model="unitFilter"
        :options="unitOptions"
        placeholder="All Units"
        class="w-40"
        :showClear="true"
      />
    </div>

    <div v-if="isLoading && !ingredients?.length" class="space-y-3">
      <div v-for="i in 5" :key="i" class="flex gap-4">
        <div class="skeleton-text flex-1 h-8" />
        <div class="skeleton-text w-24 h-8" />
        <div class="skeleton-text w-20 h-8" />
        <div class="skeleton-text w-24 h-8" />
        <div class="skeleton-text w-20 h-8" />
        <div class="skeleton-text w-16 h-8" />
      </div>
    </div>
    <template v-else>
    <DataTable
      :value="ingredients ?? []"
      :loading="isLoading"
      :paginator="true"
      :rows="10"
      :rowsPerPageOptions="[10, 25, 50]"
      stripedRows
      sortField="name"
      :sortOrder="1"
      class="p-datatable-sm"
    >
      <Column field="name" header="Name" sortable />
      <Column field="category" header="Category" sortable>
        <template #body="{ data }">
          <span v-if="data.category" class="text-gray-700">{{ data.category }}</span>
          <span v-else class="text-gray-400">—</span>
        </template>
      </Column>
      <Column field="unit" header="Unit" sortable />
      <Column field="currentStock" header="Current Stock" sortable>
        <template #body="{ data }">
          <span class="font-medium">{{ data.currentStock }}</span>
          <span class="text-gray-500 text-xs ml-1">{{ data.unit }}</span>
        </template>
      </Column>
      <Column field="reorderLevel" header="Reorder Level" sortable>
        <template #body="{ data }">
          {{ data.reorderLevel }}
        </template>
      </Column>
      <Column field="unitCost" header="Unit Cost" sortable>
        <template #body="{ data }">
          {{ formatCurrency(data.unitCost) }}
        </template>
      </Column>
      <Column header="Status">
        <template #body="{ data }">
          <Tag :value="stockStatus(data)" :severity="stockSeverity(data)" />
        </template>
      </Column>
      <Column header="Actions" style="width: 8rem">
        <template #body="{ data }">
          <div class="flex gap-1">
            <Button
              icon="pi pi-pencil"
              severity="secondary"
              text
              rounded
              @click="openEdit(data)"
            />
            <Button
              icon="pi pi-trash"
              severity="danger"
              text
              rounded
              @click="confirmDelete(data)"
            />
          </div>
        </template>
      </Column>
    </DataTable>

    <IngredientForm
      :visible="formVisible"
      :ingredient="selectedIngredient"
      @close="closeForm"
      @saved="closeForm"
    />

    <ConfirmDialog />
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useConfirm } from 'primevue/useconfirm'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import InputIcon from 'primevue/inputicon'
import IconField from 'primevue/iconfield'
import Select from 'primevue/select'
import Tag from 'primevue/tag'
import ConfirmDialog from 'primevue/confirmdialog'
import { formatCurrency } from '@/utils/formatters'
import type { Ingredient } from '@/types'
import {
  useIngredients,
  useDeleteIngredient,
} from '../composables/useInventory'
import IngredientForm from '../components/IngredientForm.vue'
import LowStockBanner from '../components/LowStockBanner.vue'

const router = useRouter()
const confirm = useConfirm()

const search = ref('')
const unitFilter = ref<string | undefined>()
const formVisible = ref(false)
const selectedIngredient = ref<Ingredient | null>(null)

const unitOptions = ['kg', 'g', 'L', 'mL', 'pcs']

const filters = computed(() => ({
  search: search.value || undefined,
  unit: unitFilter.value || undefined,
}))

const { data: ingredients, isLoading } = useIngredients(filters.value ? {
  search: filters.value.search,
  unit: filters.value.unit,
} : undefined)
const deleteMutation = useDeleteIngredient()

function stockStatus(ing: Ingredient): string {
  if (ing.currentStock <= 0) return 'Critical'
  if (ing.currentStock <= ing.reorderLevel) return 'Low'
  return 'Ok'
}

function stockSeverity(ing: Ingredient): 'danger' | 'warn' | 'success' {
  if (ing.currentStock <= 0) return 'danger'
  if (ing.currentStock <= ing.reorderLevel) return 'warn'
  return 'success'
}

function openCreate() {
  selectedIngredient.value = null
  formVisible.value = true
}

function openEdit(ing: Ingredient) {
  selectedIngredient.value = ing
  formVisible.value = true
}

function closeForm() {
  formVisible.value = false
  selectedIngredient.value = null
}

function confirmDelete(ing: Ingredient) {
  confirm.require({
    message: `Delete "${ing.name}"? This action cannot be undone.`,
    header: 'Confirm Delete',
    icon: 'pi pi-exclamation-triangle',
    rejectLabel: 'Cancel',
    acceptLabel: 'Delete',
    acceptClass: 'p-button-danger',
    accept: () => deleteMutation.mutate(ing.id),
  })
}
</script>
