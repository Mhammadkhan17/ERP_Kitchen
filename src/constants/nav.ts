export interface NavItem {
  path: string
  label: string
  icon: 'receipt' | 'box' | 'book' | 'chart-bar'
}

export const NAV_ITEMS: NavItem[] = [
  { path: '/kds', label: 'KDS Dashboard', icon: 'receipt' },
  { path: '/inventory', label: 'Inventory', icon: 'box' },
  { path: '/menu', label: 'Menu & Recipes', icon: 'book' },
  { path: '/analytics', label: 'Analytics', icon: 'chart-bar' },
]

export const NAV_ICON_CLASS: Record<NavItem['icon'], string> = {
  receipt: 'pi pi-receipt',
  box: 'pi pi-box',
  book: 'pi pi-book',
  'chart-bar': 'pi pi-chart-bar',
}
