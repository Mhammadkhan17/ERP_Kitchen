import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockHttp = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
  patch: vi.fn(),
  delete: vi.fn(),
  interceptors: { response: { use: vi.fn() } },
}))

vi.mock('axios', () => ({
  default: { create: () => mockHttp },
}))

import { api } from '@/api/client'

describe('api.ingredients.adjustStock', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('persists reason and timestamp on PATCH', async () => {
    mockHttp.get.mockResolvedValue({ data: { id: 'ing-001', currentStock: 10 } })
    mockHttp.patch.mockResolvedValue({ data: { id: 'ing-001', currentStock: 8 } })

    await api.ingredients.adjustStock('ing-001', -2, 'spilled')

    expect(mockHttp.patch).toHaveBeenCalledWith('/ingredients/ing-001', {
      currentStock: 8,
      lastAdjustReason: 'spilled',
      lastAdjustedAt: expect.any(String),
    })
  })

  it('clamps stock at zero and still records reason', async () => {
    mockHttp.get.mockResolvedValue({ data: { id: 'ing-002', currentStock: 1 } })
    mockHttp.patch.mockResolvedValue({ data: { id: 'ing-002', currentStock: 0 } })

    await api.ingredients.adjustStock('ing-002', -5, 'used for service')

    expect(mockHttp.patch).toHaveBeenCalledWith('/ingredients/ing-002', {
      currentStock: 0,
      lastAdjustReason: 'used for service',
      lastAdjustedAt: expect.any(String),
    })
  })
})
