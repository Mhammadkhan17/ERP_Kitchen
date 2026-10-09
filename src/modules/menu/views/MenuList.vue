<template>
  <div class="flex flex-col gap-4">
    <PageHeader title="Menu & Recipes" subtitle="Dishes and recipe configuration">
      <template #actions>
        <Button
          label="Recipes"
          icon="pi pi-book"
          severity="secondary"
          @click="$router.push('/menu/recipes')"
        />
        <Button label="Add Menu Item" icon="pi pi-plus" @click="showDialog = true" />
      </template>
    </PageHeader>

    <AppSearchInput v-model="search" placeholder="Search menu" />

    <AppSkeleton v-if="isLoading" variant="table" :count="6" />
    <AppErrorState v-else-if="isError" @retry="refetch" />
    <template v-else>
      <DataTable :value="filteredItems" striped-rows :size="'small'" paginator :rows="20">
        <Column field="name" header="Name" sortable />
        <Column field="brandName" header="Brand" sortable>
          <template #body="{ data }">
            <Chip
              v-if="brandMap[data.brandId]"
              :label="data.brandName"
              :style="{
                backgroundColor: brandMap[data.brandId].color + '20',
                color: brandMap[data.brandId].color,
              }"
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
            <ToggleSwitch :model-value="data.isActive" @update:model-value="toggleActive(data)" />
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
              text
              rounded
              severity="secondary"
              aria-label="Edit"
              @click="editItem(data)"
            />
          </template>
        </Column>
        <template #empty>
          <AppEmptyState
            title="No menu items found"
            hint="Try a different search or add a menu item"
            icon="pi pi-book"
          />
        </template>
      </DataTable>
    </template>

    <MenuItemForm
      :visible="showDialog"
      :menu-item="editingItem"
      @close="closeDialog"
      @saved="closeDialog"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Button from 'primevue/button'
import Chip from 'primevue/chip'
import Tag from 'primevue/tag'
import ToggleSwitch from 'primevue/toggleswitch'
import PageHeader from '@/components/ui/PageHeader.vue'
import AppSearchInput from '@/components/ui/AppSearchInput.vue'
import AppSkeleton from '@/components/ui/AppSkeleton.vue'
import AppErrorState from '@/components/ui/AppErrorState.vue'
import AppEmptyState from '@/components/ui/AppEmptyState.vue'
import { useMenuItems, useBrands, useUpdateMenuItem } from '../composables/useMenu'
import { formatCurrency } from '@/utils/formatters'
import type { MenuItem } from '@/types'
import MenuItemForm from '../components/MenuItemForm.vue'

const search = ref('')
const showDialog = ref(false)
const editingItem = ref<MenuItem | null>(null)

const { data: itemsData, isLoading, isError, refetch } = useMenuItems()
const items = computed(() => itemsData.value ?? [])

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
      (brandMap.value[i.brandId]?.name ?? '').toLowerCase().includes(q) ||
      (i.category ?? '').toLowerCase().includes(q),
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
