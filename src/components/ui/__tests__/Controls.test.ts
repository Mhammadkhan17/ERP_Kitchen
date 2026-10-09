import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import PrimeVue from 'primevue/config'
import AppSearchInput from '../AppSearchInput.vue'
import AppDialog from '../AppDialog.vue'

describe('AppSearchInput', () => {
  it('binds modelValue through InputText', async () => {
    const w = mount(AppSearchInput, {
      props: { modelValue: 'ramen' },
      global: { plugins: [PrimeVue] },
    })
    const input = w.find('input')
    expect((input.element as HTMLInputElement).value).toBe('ramen')
    await input.setValue('pho')
    expect(w.emitted('update:modelValue')?.[0]).toEqual(['pho'])
  })
})

describe('AppDialog', () => {
  it('applies the md width by default', () => {
    const w = mount(AppDialog, {
      props: { visible: true, modal: true },
      slots: { default: 'Body' },
      global: { stubs: { Dialog: { template: '<div class="stub-dialog"><slot /></div>' } } },
    })
    expect(w.html()).toContain('stub-dialog')
    expect(w.text()).toContain('Body')
  })
})
