import { createRouter, createWebHistory } from 'vue-router'
import AppLayout from '@/components/layout/AppLayout.vue'
import PublicLayout from '@/components/layout/PublicLayout.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      component: AppLayout,
      redirect: '/kds',
      children: [
        {
          path: 'kds',
          name: 'kds.dashboard',
          component: () => import('@/modules/kds/views/OrderDashboard.vue'),
        },
        {
          path: 'inventory',
          name: 'inventory.list',
          component: () => import('@/modules/inventory/views/InventoryList.vue'),
        },
        {
          path: 'inventory/adjust',
          name: 'inventory.adjust',
          component: () => import('@/modules/inventory/views/StockAdjustment.vue'),
        },
        {
          path: 'menu',
          name: 'menu.list',
          component: () => import('@/modules/menu/views/MenuList.vue'),
        },
        {
          path: 'menu/recipes',
          name: 'menu.recipes',
          component: () => import('@/modules/menu/views/RecipeBuilder.vue'),
        },
        {
          path: 'analytics',
          name: 'analytics.dashboard',
          component: () => import('@/modules/analytics/views/AnalyticsDashboard.vue'),
        },
      ],
    },
    {
      path: '/track',
      component: PublicLayout,
      children: [
        {
          path: '',
          name: 'track.order',
          component: () => import('@/modules/order-status/views/OrderTracking.vue'),
        },
      ],
    },
    {
      path: '/portal',
      component: PublicLayout,
      children: [
        {
          path: '',
          name: 'track.portal',
          component: () => import('@/modules/order-status/views/CustomerPortal.vue'),
        },
      ],
    },
  ],
})

export default router
