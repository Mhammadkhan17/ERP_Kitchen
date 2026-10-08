export interface NavItem {
  path: string
  label: string
  icon: string
}

export const NAV_ITEMS: NavItem[] = [
  { path: '/kds', label: 'KDS Dashboard', icon: '<i class="pi pi-receipt"></i>' },
  { path: '/inventory', label: 'Inventory', icon: '<i class="pi pi-box"></i>' },
  { path: '/menu', label: 'Menu & Recipes', icon: '<i class="pi pi-book"></i>' },
  { path: '/analytics', label: 'Analytics', icon: '<i class="pi pi-chart-bar"></i>' },
]
