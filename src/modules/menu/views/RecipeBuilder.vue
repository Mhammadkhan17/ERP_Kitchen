<template>
  <div class="flex flex-col gap-4">
    <template v-if="!items.length && itemsQuery.isLoading.value">
      <div class="flex items-center justify-between">
        <div class="skeleton-heading w-48" />
        <div class="skeleton h-9 w-36 rounded-lg" />
      </div>
      <div class="flex flex-col gap-2">
        <div v-for="i in 4" :key="i" class="card space-y-2">
          <div class="skeleton-heading w-32" />
          <div class="skeleton-text w-full" />
        </div>
      </div>
    </template>
    <template v-else>
    <div class="flex items-center justify-between">
      <h1 class="text-2xl font-bold text-gray-800">Recipe Builder</h1>
      <Button
        label="Back to Menu"
        icon="pi pi-arrow-left"
        severity="secondary"
        @click="$router.push('/menu')"
      />
    </div>

    <Accordion :value="expandedIds" @update:value="onAccordionChange" multiple>
      <AccordionTab
        v-for="item in items"
        :key="item.id"
        :header="item.name"
      >
        <div v-if="recipeData[item.id] && recipeData[item.id].loaded" class="flex flex-col gap-4 p-2">
          <div class="flex items-center gap-2">
            <label class="text-sm font-medium min-w-24">Servings:</label>
            <InputNumber
              v-model="recipeData[item.id].servings"
              :min="1"
              :step="1"
              :input-style="{ width: '80px' }"
            />
          </div>

          <div class="border-t pt-2">
            <h3 class="text-sm font-semibold text-gray-600 mb-2">Current Ingredients</h3>
            <div
              v-if="!recipeData[item.id].ingredients.length"
              class="text-sm text-gray-400 mb-2"
            >
              No ingredients added yet.
            </div>
            <div
              v-for="ing in recipeData[item.id].ingredients"
              :key="ing.ingredientId"
              class="flex items-center gap-2 text-sm mb-1"
            >
              <i class="pi pi-circle-fill text-primary-400 text-xs" />
              <span>{{ getIngredientName(ing.ingredientId) }}</span>
              <span class="text-gray-400">—</span>
              <span class="font-medium">{{ ing.quantity }}</span>
              <span class="text-gray-400">{{ getIngredientUnit(ing.ingredientId) }}</span>
            </div>
          </div>

          <div class="border-t pt-2">
            <h3 class="text-sm font-semibold text-gray-600 mb-2">Add / Edit Ingredients</h3>
            <IngredientPicker
              v-model:selected="recipeData[item.id].ingredients"
              :menu-item-id="item.id"
            />
          </div>

          <div class="flex justify-end pt-2">
            <Button
              label="Save Recipe"
              icon="pi pi-check"
              :loading="upsertMutation.isPending.value"
              @click="saveRecipe(item.id)"
            />
          </div>
        </div>

        <div v-else class="flex items-center justify-center py-6 text-gray-400">
          <i class="pi pi-spin pi-spinner mr-2" />
          Loading recipe...
        </div>
      </AccordionTab>
    </Accordion>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive } from 'vue'
import Accordion from 'primevue/accordion'
import AccordionTab from 'primevue/accordiontab'
import Button from 'primevue/button'
import InputNumber from 'primevue/inputnumber'
import { api } from '@/api/client'
import { useMenuItems, useUpsertRecipe } from '../composables/useMenu'
import { useIngredients } from '@/modules/inventory/composables/useInventory'
import IngredientPicker from '../components/IngredientPicker.vue'
import type { RecipeIngredient } from '@/types'

interface RecipeEditState {
  loaded: boolean
  loading: boolean
  servings: number
  ingredients: RecipeIngredient[]
}

const itemsQuery = useMenuItems()
const items = computed(() => itemsQuery.data.value ?? [])

const ingredientsQuery = useIngredients()
const ingredientsMap = computed(() => {
  const map: Record<string, { name: string; unit: string }> = {}
  for (const ing of ingredientsQuery.data.value ?? []) {
    map[ing.id] = { name: ing.name, unit: ing.unit }
  }
  return map
})

const recipeData = reactive<Record<string, RecipeEditState>>({})
const expandedIds = ref<string[]>([])
const upsertMutation = useUpsertRecipe()

async function onAccordionChange(val: string | string[] | null | undefined) {
  const ids = Array.isArray(val) ? val : val ? [val] : []
  const newlyOpened = ids.filter((id) => !expandedIds.value.includes(id))
  expandedIds.value = ids

  for (const id of newlyOpened) {
    if (!recipeData[id] || !recipeData[id].loaded) {
      await loadRecipe(id)
    }
  }
}

async function loadRecipe(menuItemId: string) {
  if (!recipeData[menuItemId]) {
    recipeData[menuItemId] = { loaded: false, loading: true, servings: 1, ingredients: [] }
  } else {
    recipeData[menuItemId].loading = true
  }

  try {
    const recipe = await api.menu.recipes.get(menuItemId)
    recipeData[menuItemId] = {
      loaded: true,
      loading: false,
      servings: recipe?.servings ?? 1,
      ingredients: recipe?.ingredients?.map((i) => ({ ...i })) ?? [],
    }
  } catch {
    recipeData[menuItemId] = {
      loaded: true,
      loading: false,
      servings: 1,
      ingredients: [],
    }
  }
}

function getIngredientName(id: string): string {
  return ingredientsMap.value[id]?.name ?? id
}

function getIngredientUnit(id: string): string {
  return ingredientsMap.value[id]?.unit ?? ''
}

function saveRecipe(menuItemId: string) {
  const data = recipeData[menuItemId]
  if (!data) return

  upsertMutation.mutate(
    {
      menuItemId,
      servings: data.servings,
      ingredients: data.ingredients,
    },
    {
      onSuccess: () => loadRecipe(menuItemId),
    },
  )
}
</script>
