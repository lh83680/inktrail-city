import { compileSegments } from '../../../src/lib/compile/routeEngine'
import { createFakeAdapter } from '../../../src/lib/compile/adapters/fakeAdapter'
import type { LngLat } from '../../../src/lib/geo/point'

const A: LngLat = { lng: 116.4, lat: 39.91 }
const B: LngLat = { lng: 116.41, lat: 39.91 }
const C: LngLat = { lng: 116.41, lat: 39.92 }
const opts = { pool: 2, retry: 1, cooldownMs: 0, mergeM: 30 }

describe('compileSegments', () => {
  it('compiles pairs into ordered segments', async () => {
    const fake = createFakeAdapter()
    const { segments, path, fallbackCount } = await compileSegments(
      [
        { from: A, to: B, kind: 'stroke' },
        { from: B, to: C, kind: 'stroke' },
      ],
      fake,
      opts,
    )
    expect(segments).toHaveLength(2)
    expect(path.length).toBeGreaterThanOrEqual(3)
    expect(fallbackCount).toBe(0)
  })
  it('falls back to straight segment after retry failure', async () => {
    const fake = createFakeAdapter({ failNext: 10 })
    const { segments, fallbackCount, note } = await compileSegments(
      [{ from: A, to: B, kind: 'stroke' }],
      fake,
      { pool: 1, retry: 1, cooldownMs: 0, mergeM: 30 },
    )
    expect(fallbackCount).toBe(1)
    expect(note.join()).toContain('fallback')
    expect(segments[0].path).toHaveLength(2)
  })
  it('respects pool concurrency', async () => {
    const fake = createFakeAdapter({ delayMs: 20 })
    const pairs = Array.from({ length: 6 }, (_, i) => ({
      from: { lng: 116.4 + i / 1000, lat: 39.91 },
      to: { lng: 116.4 + (i + 1) / 1000, lat: 39.91 },
      kind: 'stroke' as const,
    }))
    const t0 = Date.now()
    await compileSegments(pairs, fake, { pool: 3, retry: 0, cooldownMs: 0, mergeM: 30 })
    const elapsed = Date.now() - t0
    expect(fake.maxConcurrent).toBeLessThanOrEqual(3)
    expect(elapsed).toBeGreaterThanOrEqual(30)
  })
  it('merges connected segment endpoints', async () => {
    const fake = createFakeAdapter()
    const { path } = await compileSegments(
      [
        { from: A, to: B, kind: 'stroke' },
        { from: B, to: C, kind: 'stroke' },
      ],
      fake,
      { pool: 2, retry: 0, cooldownMs: 0, mergeM: 30 },
    )
    expect(path.filter((p) => p.lng === B.lng && p.lat === B.lat)).toHaveLength(1)
  })
})
