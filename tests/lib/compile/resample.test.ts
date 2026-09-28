import { resampleAdaptive } from '../../../src/lib/compile/resample'

describe('resampleAdaptive', () => {
  it('keeps spacing within bounds along straight line', () => {
    const p = resampleAdaptive(Array.from({ length: 20 }, (_, i) => ({ x: i * 25, y: 0 })), 80)
    const gaps = p.slice(1).map((q, i) => Math.hypot(q.x - p[i].x, q.y - p[i].y))
    gaps.forEach((g) => {
      expect(g).toBeGreaterThanOrEqual(39.9)
      expect(g).toBeLessThanOrEqual(161)
    })
  })
  it('densifies sharp corners', () => {
    const corner = [{ x: 0, y: 0 }, { x: 200, y: 0 }, { x: 200, y: 200 }]
    const p = resampleAdaptive(corner, 80)
    const nearCorner = p.filter((q) => Math.hypot(q.x - 200, q.y - 0) < 60)
    expect(nearCorner.length).toBeGreaterThanOrEqual(2)
  })
  it('returns input for trivial input', () => {
    expect(resampleAdaptive([{ x: 0, y: 0 }], 80)).toHaveLength(1)
    expect(resampleAdaptive([], 80)).toHaveLength(0)
  })
  it('preserves endpoints', () => {
    const line = [{ x: 0, y: 0 }, { x: 100, y: 0 }, { x: 200, y: 0 }]
    const p = resampleAdaptive(line, 80)
    expect(p[0]).toEqual(line[0])
    expect(p[p.length - 1]).toEqual(line[line.length - 1])
  })
})
