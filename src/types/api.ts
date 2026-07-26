import type {
  Ingredient, MenuItem, Recipe, Order, Brand, DailySales, WastageLog, Customer,
} from './index'

export interface ApiClient {
  customers: {
    list: (params?: Record<string, string | number>) => Promise<Customer[]>
  }
  ingredients: {
    list: (params?: { search?: string; unit?: string }) => Promise<Ingredient[]>
    get: (id: string) => Promise<Ingredient>
    create: (data: Partial<Ingredient>) => Promise<Ingredient>
    update: (id: string, data: Partial<Ingredient>) => Promise<Ingredient>
    delete: (id: string) => Promise<void>
    adjustStock: (id: string, delta: number, reason: string) => Promise<Ingredient>
  }
  orders: {
    list: (params?: Record<string, string | number>) => Promise<Order[]>
    get: (id: string) => Promise<Order>
    create: (data: Partial<Order>) => Promise<Order>
    updateStatus: (id: string, status: Order['status']) => Promise<Order>
  }
  menu: {
    items: {
      list: () => Promise<MenuItem[]>
      get: (id: string) => Promise<MenuItem>
      create: (data: Partial<MenuItem>) => Promise<MenuItem>
      update: (id: string, data: Partial<MenuItem>) => Promise<MenuItem>
      delete: (id: string) => Promise<void>
    }
    recipes: {
      get: (menuItemId: string) => Promise<Recipe>
      upsert: (data: Partial<Recipe>) => Promise<Recipe>
    }
    brands: {
      list: () => Promise<Brand[]>
    }
  }
  analytics: {
    sales: {
      list: (range?: { start: string; end: string }) => Promise<DailySales[]>
    }
    wastage: {
      list: () => Promise<WastageLog[]>
      create: (data: Partial<WastageLog>) => Promise<WastageLog>
    }
  }
}
