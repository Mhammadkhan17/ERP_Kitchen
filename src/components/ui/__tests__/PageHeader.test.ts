import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import PageHeader from '../PageHeader.vue'

describe('PageHeader', () => {
  it('renders title and subtitle', () => {
    const w = mount(PageHeader, { props: { title: 'Analytics', subtitle: 'Overview' } })
    expect(w.text()).toContain('Analytics')
    expect(w.text()).toContain('Overview')
  })
  it('defaults to left aligned h1', () => {
    const w = mount(PageHeader, { props: { title: 'Menu' } })
    expect(w.find('h1').classes()).toContain('text-2xl')
    expect(w.find('h1').classes()).not.toContain('text-center')
  })
  it('supports center align and actions slot', () => {
    const w = mount(PageHeader, {
      props: { title: 'Track', align: 'center' },
      slots: { actions: '<button id="a">Refresh</button>' },
    })
    expect(w.find('h1').classes()).toContain('text-center')
    expect(w.find('#a').exists()).toBe(true)
  })
})
