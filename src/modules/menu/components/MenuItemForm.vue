<template>
  <Dialog
    :visible="visible"
    :header="menuItem ? 'Edit Menu Item' : 'Add Menu Item'"
    :modal="true"
    :style="{ width: '480px' }"
    @update:visible="$emit('close')"
  >
    <form @submit.prevent="handleSubmit" class="flex flex-col gap-4 p-4">
      <div class="flex flex-col gap-1">
        <label for="name">Name</label>
        <InputText id="name" v-model="form.name" />
        <small v-if="errors.name" class="text-red-500">{{ errors.name }}</small>
      </div>

      <div class="flex flex-col gap-1">
        <label for="brand">Brand</label>
        <Select
          id="brand"
          v-model="form.brandId"
          :options="brands"
          option-label="name"
          option-value="id"
          placeholder="Select a brand"
          :loading="brandsQuery.isLoading.value"
          show-clear
        />
        <small v-if="errors.brandId" class="text-red-500">{{ errors.brandId }}</small>
      </div>

      <div class="flex flex-col gap-1">
        <label for="price">Price ($)</label>
        <InputNumber
          id="price"
          v-model="form.price"
          :min="0"
          :step="0.01"
          :max-fraction-digits="2"
          placeholder="0.00"
        />
        <small v-if="errors.price" class="text-red-500">{{ errors.price }}</small>
      </div>

      <div class="flex flex-col gap-1">
        <label for="category">Category</label>
        <Select
          id="category"
          v-model="form.category"
          :options="categories"
          placeholder="Select a category"
        />
        <small v-if="errors.category" class="text-red-500">{{ errors.category }}</small>
      </div>

      <div class="flex items-center gap-2">
        <ToggleSwitch v-model="form.isActive" input-id="isActive" />
        <label for="isActive">Active</label>
      </div>

      <div class="flex justify-end gap-2 pt-2">
        <Button type="button" label="Cancel" severity="secondary" @click="$emit('close')" />
        <Button type="submit" label="Save" :loading="isPending" />
      </div>
    </form>
  </Dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import Dialog from 'primevue/dialog'
import InputText from 'primevue/inputtext'
import InputNumber from 'primevue/inputnumber'
import Select from 'primevue/select'
import ToggleSwitch from 'primevue/toggleswitch'
import Button from 'primevue/button'
import { useBrands, useCreateMenuItem, useUpdateMenuItem } from '../composables/useMenu'
import { required, positiveNumber } from '@/utils/validators'
import type { MenuItem } from '@/types'

const props = defineProps<{
  visible: boolean
  menuItem: MenuItem | null
}>()

const emit = defineEmits<{
  close: []
  saved: []
}>()

const categories = ['starter', 'mains', 'desserts', 'beverages']

const form = ref({
  name: '',
  brandId: '',
  price: 0,
  category: '',
  isActive: true,
})

const errors = ref<Record<string, string>>({})

const brandsQuery = useBrands()
const brands = computed(() => brandsQuery.data.value ?? [])

const createMutation = useCreateMenuItem()
const updateMutation = useUpdateMenuItem()
const isPending = computed(() => createMutation.isPending.value || updateMutation.isPending.value)

watch(
  () => props.menuItem,
  (item) => {
    if (item) {
      form.value = {
        name: item.name,
        brandId: item.brandId,
        price: item.price,
        category: item.category,
        isActive: item.isActive,
      }
    } else {
      form.value = { name: '', brandId: '', price: 0, category: '', isActive: true }
    }
    errors.value = {}
  },
  { immediate: true },
)

function validate(): boolean {
  const e: Record<string, string> = {}

  const nameResult = required(form.value.name)
  if (nameResult !== true) e.name = nameResult as string

  const brandResult = required(form.value.brandId)
  if (brandResult !== true) e.brandId = brandResult as string

  const priceResult = positiveNumber(form.value.price)
  if (priceResult !== true) e.price = priceResult as string

  const catResult = required(form.value.category)
  if (catResult !== true) e.category = catResult as string

  errors.value = e
  return Object.keys(e).length === 0
}

async function handleSubmit() {
  if (!validate()) return

  const payload = { ...form.value }

  if (props.menuItem) {
    await updateMutation.mutateAsync({ id: props.menuItem.id, data: payload })
  } else {
    await createMutation.mutateAsync(payload)
  }

  emit('saved')
}
</script>
