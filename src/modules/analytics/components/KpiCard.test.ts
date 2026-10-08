import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import KpiCard from './KpiCard.vue'

describe('KpiCard', () => {
  it('renders title, value, and subtitle', () => {
    const wrapper = mount(KpiCard, {
      props: {
        title: 'Total Revenue',
        value: '$1,234.00',
        icon: 'pi-dollar',
        subtitle: '42 orders',
      },
    })
    expect(wrapper.text()).toContain('Total Revenue')
    expect(wrapper.text()).toContain('$1,234.00')
    expect(wrapper.text()).toContain('42 orders')
  })
})
