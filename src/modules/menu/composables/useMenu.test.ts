import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { Recipe } from '@/types'
import { loadRecipe } from './useMenu'

vi.mock('@/api/client', () => ({
  api: {
    menu: {
      recipes: {
        get: vi.fn(),
      },
    },
  },
}))

import { api } from '@/api/client'

describe('loadRecipe', () => {
  beforeEach(() => vi.clearAllMocks())

  it('fetches through api.menu.recipes.get', async () => {
    const recipe: Recipe = {
      id: 'r1',
      menuItemId: 'm1',
      servings: 2,
      version: 1,
      ingredients: [{ ingredientId: 'i1', quantity: 100 }],
    }
    vi.mocked(api.menu.recipes.get).mockResolvedValue(recipe)

    const result = await loadRecipe('r1')

    expect(api.menu.recipes.get).toHaveBeenCalledWith('r1')
    expect(result.id).toBe('r1')
  })
})
