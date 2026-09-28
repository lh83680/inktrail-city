import { createFakeAdapter } from '../../../src/lib/compile/adapters/fakeAdapter'

describe('fakeAdapter', () => {
  it('fake route returns straight line and counts calls', async () => {
    const fake = createFakeAdapter()
    const path = await fake.route({ lng: 0, lat: 0 }, { lng: 1, lat: 1 }, 'walk')
    expect(path).toHaveLength(2)
    expect(fake.calls.route).toBe(1)
  })
  it('fake reverseGeocode returns deterministic road', async () => {
    const fake = createFakeAdapter()
    const r = await fake.reverseGeocode({ lng: 0, lat: 0 })
    expect(r.road).toContain('路')
  })
  it('failNext makes route reject, then recover', async () => {
    const fake = createFakeAdapter({ failNext: 1 })
    await expect(fake.route({ lng: 0, lat: 0 }, { lng: 1, lat: 1 }, 'walk')).rejects.toThrow()
    const ok = await fake.route({ lng: 0, lat: 0 }, { lng: 1, lat: 1 }, 'walk')
    expect(ok).toHaveLength(2)
  })
  it('tracks max concurrency', async () => {
    const fake = createFakeAdapter({ delayMs: 20 })
    await Promise.all([
      fake.route({ lng: 0, lat: 0 }, { lng: 1, lat: 1 }, 'walk'),
      fake.route({ lng: 0, lat: 0 }, { lng: 1, lat: 1 }, 'walk'),
    ])
    expect(fake.maxConcurrent).toBeGreaterThanOrEqual(1)
    expect(fake.maxConcurrent).toBeLessThanOrEqual(2)
  })
})
