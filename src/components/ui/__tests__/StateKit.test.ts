import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import AppSkeleton from '../AppSkeleton.vue'
import AppEmptyState from '../AppEmptyState.vue'
import AppErrorState from '../AppErrorState.vue'

describe('state kit', () => {
  it('skeleton renders count blocks for cards', () => {
    const w = mount(AppSkeleton, { props: { variant: 'cards', count: 4 } })
    expect(w.findAll('.animate-pulse')).toHaveLength(4)
  })
  it('empty state shows title and hint', () => {
    const w = mount(AppEmptyState, {
      props: { title: 'No matching ingredients', hint: 'Try a different search' },
    })
    expect(w.text()).toContain('No matching ingredients')
    expect(w.text()).toContain('Try a different search')
  })
  it('error state shows message and emits retry', async () => {
    const w = mount(AppErrorState, { props: { message: 'Could not load orders' } })
    expect(w.text()).toContain('Could not load orders')
    await w.find('button').trigger('click')
    expect(w.emitted('retry')).toBeTruthy()
  })
})
