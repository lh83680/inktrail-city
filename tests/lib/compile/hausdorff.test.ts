import { samplePolyline, hausdorffM, fidelity } from '../../../src/lib/compile/hausdorff'

const ring = (r: number, n = 150) =>
  samplePolyline(
    Array.from({ length: n + 1 }, (_, i) => {
      const a = (i / n) * 2 * Math.PI
      return { x: Math.cos(a) * r, y: Math.sin(a) * r }
    }),
    150,
  )

describe('hausdorff', () => {
  it('samples exact count for a polyline', () => {
    expect(samplePolyline([{ x: 0, y: 0 }, { x: 10, y: 0 }], 5)).toHaveLength(5)
  })
  it('concentric circles: hausdorff equals radius difference', () => {
    expect(hausdorffM(ring(100), ring(120))).toBeCloseTo(20, 0)
  })
  it('translated circle: hausdorff equals translation', () => {
    const a = ring(100)
    const b = a.map((p) => ({ x: p.x + 100, y: p.y }))
    expect(hausdorffM(a, b)).toBeCloseTo(100, 0)
  })
  it('fidelity is 1 when route overlaps stroke', () => {
    expect(fidelity(ring(100), ring(100))).toBe(1)
  })
  it('fidelity drops below 0.78 threshold when route far away', () => {
    const route = ring(100).map((p) => ({ x: p.x + 300, y: p.y + 300 }))
    expect(fidelity(ring(100), route)).toBeLessThan(0.78)
  })
})
