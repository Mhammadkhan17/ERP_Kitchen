<template>
  <div class="flex flex-col gap-4">
    <PageHeader title="Inventory" subtitle="Stock levels and low-stock alerts">
      <template #actions>
        <Button
          label="Stock Adjustment"
          severity="secondary"
          outlined
          icon="pi pi-refresh"
          @click="$router.push('/inventory/adjust')"
        />
        <Button label="Add Ingredient" icon="pi pi-plus" @click="openCreate" />
      </template>
    </PageHeader>

    <LowStockBanner
      v-if="!isLoading && !isError && ingredients?.length"
      :ingredients="ingredients"
    />

    <div class="flex items-center gap-3">
      <AppSearchInput v-model="search" placeholder="Search ingredients" class="flex-1" />
      <Select
        v-model="unitFilter"
        :options="unitOptions"
        placeholder="All Units"
        class="w-40"
        :show-clear="true"
      />
    </div>

    <AppSkeleton v-if="isLoading" variant="table" :count="6" />
    <AppErrorState v-else-if="isError" @retry="refetch" />
    <template v-else>
      <DataTable
        :value="filteredIngredients"
        :paginator="true"
        :rows="10"
        :rows-per-page-options="[10, 25, 50]"
        striped-rows
        sort-field="name"
        :sort-order="1"
        class="p-datatable-sm"
      >
        <Column field="name" header="Name" sortable />
        <Column field="category" header="Category" sortable>
          <template #body="{ data }">
            <span v-if="data.category" class="text-gray-700">{{ data.category }}</span>
            <span v-else class="text-gray-400">-</span>
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
            <span
              class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
              :class="stockTint(data)"
            >
              {{ stockStatus(data) }}
            </span>
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
                aria-label="Edit"
                @click="openEdit(data)"
              />
              <Button
                icon="pi pi-trash"
                severity="danger"
                text
                rounded
                aria-label="Delete"
                @click="confirmDelete(data)"
              />
            </div>
          </template>
        </Column>
        <template #empty>
          <AppEmptyState
            title="No ingredients found"
            hint="Try a different search or add an ingredient"
            icon="pi pi-box"
          />
        </template>
      </DataTable>
    </template>

    <IngredientForm
      :visible="formVisible"
      :ingredient="selectedIngredient"
      @close="closeForm"
      @saved="closeForm"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useConfirm } from 'primevue/useconfirm'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Button from 'primevue/button'
import Select from 'primevue/select'
import PageHeader from '@/components/ui/PageHeader.vue'
import AppSearchInput from '@/components/ui/AppSearchInput.vue'
import AppSkeleton from '@/components/ui/AppSkeleton.vue'
import AppErrorState from '@/components/ui/AppErrorState.vue'
import AppEmptyState from '@/components/ui/AppEmptyState.vue'
import { formatCurrency } from '@/utils/formatters'
import type { Ingredient } from '@/types'
import { useIngredients, useDeleteIngredient } from '../composables/useInventory'
import IngredientForm from '../components/IngredientForm.vue'
import LowStockBanner from '../components/LowStockBanner.vue'

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

const { data: ingredients, isLoading, isError, refetch } = useIngredients(filters)

const filteredIngredients = computed(() => {
  const rows = ingredients.value ?? []
  const q = search.value.trim().toLowerCase()
  if (!q) return rows
  return rows.filter(
    (i) => i.name.toLowerCase().includes(q) || i.category?.toLowerCase().includes(q),
  )
})
const deleteMutation = useDeleteIngredient()

function stockStatus(ing: Ingredient): string {
  if (ing.currentStock <= 0) return 'Critical'
  if (ing.currentStock <= ing.reorderLevel) return 'Low'
  return 'Ok'
}

function stockTint(ing: Ingredient): string {
  if (ing.currentStock <= 0) return 'bg-red-50 text-red-600'
  if (ing.currentStock <= ing.reorderLevel) return 'bg-amber-50 text-amber-700'
  return 'bg-green-50 text-green-700'
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
