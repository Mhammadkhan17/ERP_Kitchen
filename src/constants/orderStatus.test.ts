// src/constants/orderStatus.test.ts
import { describe, it, expect } from 'vitest'
import {
  timerTier,
  TIMER_TIER_CLASS,
  ORDER_STATUS_TINT_CLASS,
  ORDER_STATUS_SPINE_CLASS,
  ORDER_STATUS_CTA,
} from './orderStatus'
import type { OrderStatus } from '@/types'

describe('timerTier', () => {
  it('is ontrack under 8 minutes', () => {
    expect(timerTier(0)).toBe('ontrack')
    expect(timerTier(7.9)).toBe('ontrack')
  })
  it('is soon from 8 to under 12 minutes', () => {
    expect(timerTier(8)).toBe('soon')
    expect(timerTier(11.9)).toBe('soon')
  })
  it('is late at 12 minutes and above', () => {
    expect(timerTier(12)).toBe('late')
    expect(timerTier(99)).toBe('late')
  })
  it('maps tiers to AA text classes', () => {
    expect(TIMER_TIER_CLASS.ontrack).toBe('text-green-700')
    expect(TIMER_TIER_CLASS.soon).toBe('text-amber-700')
    expect(TIMER_TIER_CLASS.late).toBe('text-red-600')
  })
})

describe('status class maps', () => {
  const statuses: OrderStatus[] = ['pending', 'preparing', 'ready', 'dispatched', 'cancelled']
  it('every status has tint, spine, and CTA entries', () => {
    for (const s of statuses) {
      expect(ORDER_STATUS_TINT_CLASS[s]).toBeTruthy()
      expect(ORDER_STATUS_SPINE_CLASS[s]).toBeTruthy()
    }
    expect(ORDER_STATUS_CTA.pending?.label).toBe('Start')
    expect(ORDER_STATUS_CTA.preparing?.label).toBe('Ready')
    expect(ORDER_STATUS_CTA.ready?.label).toBe('Dispatch')
    expect(ORDER_STATUS_CTA.dispatched).toBeNull()
    expect(ORDER_STATUS_CTA.cancelled).toBeNull()
  })
})
