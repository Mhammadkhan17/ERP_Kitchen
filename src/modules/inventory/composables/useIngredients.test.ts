import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, ref, nextTick } from 'vue'
import { VueQueryPlugin, QueryClient, useQueryClient } from '@tanstack/vue-query'
import { useIngredients } from './useInventory'

vi.mock('@/api/client', () => ({
  api: {
    ingredients: {
      list: vi.fn().mockResolvedValue([]),
    },
  },
}))

import { api } from '@/api/client'

const Harness = defineComponent({
  props: {
    search: { type: String, default: '' },
  },
  setup(props) {
    const filters = ref({ search: props.search, unit: undefined })
    const query = useIngredients(filters)
    const qc = useQueryClient()
    return { filters, query, qc }
  },
  template: '<div />',
})

function mountHarness() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return mount(Harness, {
    global: { plugins: [[VueQueryPlugin, { queryClient: client }]] },
  })
}

describe('useIngredients reactive filters', () => {
  beforeEach(() => vi.clearAllMocks())

  it('issues a new request when the filters ref changes', async () => {
    const wrapper = mountHarness()
    await nextTick()
    await nextTick()

    expect(api.ingredients.list).toHaveBeenCalledWith({ search: '', unit: undefined })

    const vm = wrapper.vm as unknown as { filters: { search: string } }
    vm.filters.search = 'chicken'
    await nextTick()
    await nextTick()

    expect(api.ingredients.list).toHaveBeenCalledWith({ search: 'chicken', unit: undefined })
  })
})
