import { describe, it, expect } from 'vitest'
import { formatCurrency, statusLabel, statusColor } from './formatters'

describe('formatCurrency', () => {
  it('formats USD with two decimals', () => {
    expect(formatCurrency(12.5)).toBe('$12.50')
  })
})

describe('statusLabel', () => {
  it('maps known statuses', () => {
    expect(statusLabel('preparing')).toBe('Preparing')
  })
  it('falls back to the raw value', () => {
    expect(statusLabel('unknown')).toBe('unknown')
  })
})

describe('statusColor', () => {
  it('maps known statuses through constants', () => {
    expect(statusColor('ready')).toBe('#2B9348')
  })
})
