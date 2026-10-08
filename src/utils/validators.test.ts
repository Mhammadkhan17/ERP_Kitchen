import { describe, it, expect } from 'vitest'
import { required, positiveNumber, minLength } from './validators'

describe('required', () => {
  it('rejects empty values', () => {
    expect(required('')).toBe('This field is required')
    expect(required(null)).toBe('This field is required')
  })
  it('accepts non-empty values', () => {
    expect(required('x')).toBe(true)
  })
})

describe('positiveNumber', () => {
  it('rejects zero and negatives', () => {
    expect(positiveNumber(0)).toBe('Must be a positive number')
    expect(positiveNumber(-1)).toBe('Must be a positive number')
  })
  it('accepts positives', () => {
    expect(positiveNumber(2.5)).toBe(true)
  })
})

describe('minLength', () => {
  it('enforces the configured minimum', () => {
    const check = minLength(3)
    expect(check('ab')).toBe('Must be at least 3 characters')
    expect(check('abc')).toBe(true)
  })
})
