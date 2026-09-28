import { toMeters, pathLengthM } from '../../../src/lib/geo/point'
const BEIJING = { lng: 116.404, lat: 39.915 }
describe('geo', () => {
  it('projects to local meters', () => {
    const m = toMeters({ lng: 116.405, lat: 39.915 }, BEIJING)
    expect(m.x).toBeGreaterThan(80)
    expect(m.x).toBeLessThan(100)
    expect(m.y).toBeCloseTo(0, 6)
  })
  it('sums path length', () => {
    const path = [BEIJING, { lng: 116.405, lat: 39.915 }, { lng: 116.405, lat: 39.916 }]
    expect(pathLengthM(path)).toBeGreaterThan(150)
  })
})
