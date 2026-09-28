import { toGPX } from '../../../src/lib/share/gpx'
import { navDeepLink } from '../../../src/lib/share/deeplink'
import type { CompiledRoute } from '../../../src/lib/compile/types'

const makeRoute = (n = 3): CompiledRoute => ({
  segments: Array.from({ length: n }, (_, i) => ({
    path: [
      { lng: 116.4 + i * 0.001, lat: 39.9 },
      { lng: 116.4 + (i + 1) * 0.001, lat: 39.9 },
    ],
    from: { lng: 116.4 + i * 0.001, lat: 39.9 },
    to: { lng: 116.4 + (i + 1) * 0.001, lat: 39.9 },
    kind: 'stroke' as const,
  })),
  path: [],
  distanceM: 500,
  walkMin: 7,
  fidelity: 0.9,
  note: [],
})

describe('gpx', () => {
  it('gpx contains trkpt per path point', () => {
    const r = makeRoute(3)
    r.path = r.segments.flatMap((s) => s.path)
    const gpx = toGPX(r, '福')
    expect((gpx.match(/<trkpt/g) || []).length).toBe(r.path.length)
    expect(gpx).toContain('<name>福</name>')
    expect(gpx).toContain('lat="39.900000"')
  })
})

describe('deeplink', () => {
  it('uses walking mode and src marker', () => {
    const u = navDeepLink({ lng: 1, lat: 2 }, { lng: 3, lat: 4 }, 'walk')
    expect(u).toContain('mode=walking')
    expect(u).toContain('src=inktrail.hackathon')
    expect(u).toContain('coord_type=bd09ll')
  })
  it('maps ride and drive modes', () => {
    expect(navDeepLink({ lng: 1, lat: 2 }, { lng: 3, lat: 4 }, 'ride')).toContain('mode=riding')
    expect(navDeepLink({ lng: 1, lat: 2 }, { lng: 3, lat: 4 }, 'drive')).toContain('mode=driving')
  })
  it('uses origin lat,lng order', () => {
    const u = navDeepLink({ lng: 116.4, lat: 39.9 }, { lng: 116.5, lat: 39.95 }, 'walk')
    expect(u).toContain('origin=39.9%2C116.4')
    expect(u).toContain('destination=39.95%2C116.5')
  })
})
