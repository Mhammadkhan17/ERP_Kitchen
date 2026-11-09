import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockFrom = vi.hoisted(() => {
  const builder: Record<string, unknown> = {}
  const makeBuilder = () => {
    const b: Record<string, unknown> = {}
    for (const method of ['select', 'insert', 'update', 'delete', 'eq', 'ilike', 'gte', 'lte', 'limit', 'single']) {
      b[method] = vi.fn(() => b)
    }
    return b
  }
  return {
    from: vi.fn(() => makeBuilder()),
    builder,
  }
})

vi.mock('@/api/supabase', () => ({
  supabase: { from: mockFrom.from },
}))

import { api } from '@/api/client'

describe('api.ingredients.adjustStock', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('persists reason and timestamp on update', async () => {
    const getBuilder = {
      select: vi.fn(() => getBuilder),
      eq: vi.fn(() => getBuilder),
      single: vi.fn(() => Promise.resolve({ data: { id: 'ing-001', currentStock: 10 }, error: null })),
    }
    const updateBuilder = {
      update: vi.fn((payload: Record<string, unknown>) => {
        updateBuilder.lastPayload = payload
        return updateBuilder
      }),
      eq: vi.fn(() => updateBuilder),
      select: vi.fn(() => updateBuilder),
      single: vi.fn(() =>
        Promise.resolve({ data: { id: 'ing-001', currentStock: 8 }, error: null }),
      ),
      lastPayload: {} as Record<string, unknown>,
    }

    mockFrom.from
      .mockReturnValueOnce(getBuilder as never)
      .mockReturnValueOnce(updateBuilder as never)

    await api.ingredients.adjustStock('ing-001', -2, 'spilled')

    expect(updateBuilder.lastPayload).toMatchObject({
      currentStock: 8,
      lastAdjustReason: 'spilled',
      lastAdjustedAt: expect.any(String),
    })
  })

  it('clamps stock at zero and still records reason', async () => {
    const getBuilder = {
      select: vi.fn(() => getBuilder),
      eq: vi.fn(() => getBuilder),
      single: vi.fn(() => Promise.resolve({ data: { id: 'ing-002', currentStock: 1 }, error: null })),
    }
    const updateBuilder = {
      update: vi.fn((payload: Record<string, unknown>) => {
        updateBuilder.lastPayload = payload
        return updateBuilder
      }),
      eq: vi.fn(() => updateBuilder),
      select: vi.fn(() => updateBuilder),
      single: vi.fn(() =>
        Promise.resolve({ data: { id: 'ing-002', currentStock: 0 }, error: null }),
      ),
      lastPayload: {} as Record<string, unknown>,
    }

    mockFrom.from
      .mockReturnValueOnce(getBuilder as never)
      .mockReturnValueOnce(updateBuilder as never)

    await api.ingredients.adjustStock('ing-002', -5, 'used for service')

    expect(updateBuilder.lastPayload).toMatchObject({
      currentStock: 0,
      lastAdjustReason: 'used for service',
      lastAdjustedAt: expect.any(String),
    })
  })

  it('throws on supabase error', async () => {
    const getBuilder = {
      select: vi.fn(() => getBuilder),
      eq: vi.fn(() => getBuilder),
      single: vi.fn(() =>
        Promise.resolve({ data: null, error: { message: 'row not found' } }),
      ),
    }
    mockFrom.from.mockReturnValueOnce(getBuilder as never)

    await expect(api.ingredients.get('missing')).rejects.toThrow('row not found')
  })
})
