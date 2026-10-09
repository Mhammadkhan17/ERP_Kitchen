import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import KpiCard from './KpiCard.vue'

describe('KpiCard', () => {
  it('renders label, value, and icon', () => {
    const wrapper = mount(KpiCard, {
      props: {
        label: 'Total Revenue',
        value: '$1,234.00',
        icon: 'pi-dollar',
      },
    })
    expect(wrapper.text()).toContain('Total Revenue')
    expect(wrapper.text()).toContain('$1,234.00')
    expect(wrapper.find('i.pi-dollar').exists()).toBe(true)
    expect(wrapper.find('i.pi-dollar').classes()).toContain('text-gray-500')
  })

  it('renders the value in mono tabular numerals', () => {
    const wrapper = mount(KpiCard, {
      props: {
        label: 'Total Orders',
        value: '42',
        icon: 'pi-receipt',
      },
    })
    const value = wrapper.find('.font-mono.tabular-nums')
    expect(value.exists()).toBe(true)
    expect(value.text()).toBe('42')
  })
})
