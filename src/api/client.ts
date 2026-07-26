import axios from 'axios'
import type { ApiClient } from '@/types/api'
import type {
  Ingredient, MenuItem, Recipe, Order, Brand, DailySales, WastageLog, Customer,
} from '@/types'

const http = axios.create({
  baseURL: '/api',
  timeout: 10000,
})

http.interceptors.response.use(
  (res) => res,
  (error) => {
    console.error('[API Error]', error.response?.data || error.message)
    return Promise.reject(error)
  },
)

export const api: ApiClient = {
  customers: {
    list: (params) => http.get('/customers', { params }).then((r) => r.data),
  },
  ingredients: {
    list: (params) => http.get('/ingredients', { params }).then((r) => r.data),
    get: (id) => http.get(`/ingredients/${id}`).then((r) => r.data),
    create: (data) => http.post('/ingredients', data).then((r) => r.data),
    update: (id, data) => http.patch(`/ingredients/${id}`, data).then((r) => r.data),
    delete: (id) => http.delete(`/ingredients/${id}`),
    adjustStock: (id, delta, reason) =>
      http.get(`/ingredients/${id}`).then((r) => {
        const ing = r.data as Ingredient
        return http.patch(`/ingredients/${id}`, {
          currentStock: Math.max(0, +(ing.currentStock + delta).toFixed(3)),
        }).then((r2) => r2.data)
      }),
  },

  orders: {
    list: (params) => http.get('/orders', { params }).then((r) => r.data),
    get: (id) => http.get(`/orders/${id}`).then((r) => r.data),
    create: (data) => http.post('/orders', data).then((r) => r.data),
    updateStatus: (id, status) => http.patch(`/orders/${id}`, { status }).then((r) => r.data),
  },

  menu: {
    items: {
      list: () => http.get('/menuItems').then((r) => r.data),
      get: (id) => http.get(`/menuItems/${id}`).then((r) => r.data),
      create: (data) => http.post('/menuItems', data).then((r) => r.data),
      update: (id, data) => http.patch(`/menuItems/${id}`, data).then((r) => r.data),
      delete: (id) => http.delete(`/menuItems/${id}`),
    },
    recipes: {
      get: (menuItemId) =>
        http.get('/recipes', { params: { menuItemId } }).then((r) => r.data[0]),
      upsert: (data) =>
        http.get('/recipes', { params: { menuItemId: data.menuItemId } }).then((r) => {
          const existing = r.data[0]
          return existing
            ? http.patch(`/recipes/${existing.id}`, data).then((r2) => r2.data)
            : http.post('/recipes', data).then((r2) => r2.data)
        }),
    },
    brands: {
      list: () => http.get('/brands').then((r) => r.data),
    },
  },

  analytics: {
    sales: {
      list: (range) =>
        http.get('/analytics_sales', { params: range }).then((r) => r.data),
    },
    wastage: {
      list: () => http.get('/wastage_logs').then((r) => r.data),
      create: (data) => http.post('/wastage_logs', data).then((r) => r.data),
    },
  },
}
