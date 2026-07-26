<template>
  <div class="flex flex-col gap-4">
    <div class="flex items-center justify-between">
      <h1 class="text-2xl font-bold text-gray-800">Menu Items</h1>
      <div class="flex gap-2">
        <Button
          label="Recipes"
          icon="pi pi-book"
          severity="secondary"
          @click="$router.push('/menu/recipes')"
        />
        <Button label="Add Menu Item" icon="pi pi-plus" @click="showDialog = true" />
      </div>
    </div>

    <div class="flex items-center gap-2">
      <span class="p-input-icon-left flex-1">
        <i class="pi pi-search" />
        <InputText v-model="search" placeholder="Search menu items..." class="w-full" />
      </span>
    </div>

    <div v-if="itemsQuery.isLoading.value && !items.length" class="space-y-3">
      <div v-for="i in 5" :key="i" class="flex gap-4">
        <div class="skeleton-text flex-1 h-8" />
        <div class="skeleton-text w-24 h-8" />
        <div class="skeleton-text w-20 h-8" />
        <div class="skeleton-text w-16 h-8" />
        <div class="skeleton-text w-24 h-8" />
      </div>
    </div>
    <template v-else>
    <DataTable
      :value="filteredItems"
      :loading="itemsQuery.isLoading.value"
      striped-rows
      :size="'small'"
      paginator
      :rows="20"
    >
      <Column field="name" header="Name" sortable />
      <Column field="brandName" header="Brand" sortable>
        <template #body="{ data }">
          <Chip
            v-if="brandMap[data.brandId]"
            :label="data.brandName"
            :style="{ backgroundColor: brandMap[data.brandId].color + '20', color: brandMap[data.brandId].color }"
            class="font-medium"
          />
          <span v-else class="text-gray-400">{{ data.brandName }}</span>
        </template>
      </Column>
      <Column field="price" header="Price" sortable>
        <template #body="{ data }">
          {{ formatCurrency(data.price) }}
        </template>
      </Column>
      <Column field="category" header="Category" sortable>
        <template #body="{ data }">
          <Tag :value="data.category" :severity="categorySeverity(data.category)" />
        </template>
      </Column>
      <Column field="isActive" header="Active" style="width: 100px">
        <template #body="{ data }">
          <ToggleSwitch
            :model-value="data.isActive"
            @update:model-value="toggleActive(data)"
          />
        </template>
      </Column>
      <Column field="popularity" header="Popularity" sortable>
        <template #body="{ data }">
          <div class="flex items-center gap-1">
            <i class="pi pi-star-fill text-yellow-500 text-xs" />
            <span>{{ data.popularity }}</span>
          </div>
        </template>
      </Column>
      <Column header="Actions" style="width: 100px">
        <template #body="{ data }">
          <Button
            icon="pi pi-pencil"
            severity="secondary"
            size="small"
            @click="editItem(data)"
          />
        </template>
      </Column>
    </DataTable>

    <MenuItemForm
      :visible="showDialog"
      :menu-item="editingItem"
      @close="closeDialog"
      @saved="closeDialog"
    />
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import Chip from 'primevue/chip'
import Tag from 'primevue/tag'
import ToggleSwitch from 'primevue/toggleswitch'
import { useMenuItems, useBrands, useUpdateMenuItem } from '../composables/useMenu'
import { formatCurrency } from '@/utils/formatters'
import type { MenuItem } from '@/types'
import MenuItemForm from '../components/MenuItemForm.vue'

const router = useRouter()
const search = ref('')
const showDialog = ref(false)
const editingItem = ref<MenuItem | null>(null)

const itemsQuery = useMenuItems()
const items = computed(() => itemsQuery.data.value ?? [])

const brandsQuery = useBrands()
const brandMap = computed(() => {
  const map: Record<string, { id: string; name: string; color: string }> = {}
  for (const b of brandsQuery.data.value ?? []) {
    map[b.id] = b
  }
  return map
})

const updateMutation = useUpdateMenuItem()

const filteredItems = computed(() => {
  if (!search.value) return items.value
  const q = search.value.toLowerCase()
  return items.value.filter(
    (i) =>
      i.name.toLowerCase().includes(q) ||
      i.brandName.toLowerCase().includes(q) ||
      i.category.toLowerCase().includes(q),
  )
})

function categorySeverity(cat: string) {
  const map: Record<string, string> = {
    starter: 'info',
    mains: 'success',
    desserts: 'warn',
    beverages: 'contrast',
  }
  return map[cat] ?? null
}

function editItem(item: MenuItem) {
  editingItem.value = item
  showDialog.value = true
}

function closeDialog() {
  showDialog.value = false
  editingItem.value = null
}

function toggleActive(item: MenuItem) {
  updateMutation.mutate({ id: item.id, data: { isActive: !item.isActive } })
}
</script>
