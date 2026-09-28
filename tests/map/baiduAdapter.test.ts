import { createBaiduAdapter } from '../../src/map/baiduAdapter'
import type { LngLat } from '../../src/lib/geo/point'

function createFakeGL(opts: { walkEmpty?: boolean } = {}) {
  const calls = { WalkingRoute: 0, RidingRoute: 0, DrivingRoute: 0, Geocoder: 0 }
  const gl: any = {}
  gl.BMAP_STATUS_SUCCESS = 0
  gl.Point = class {
    constructor(public lng: number, public lat: number) {}
  }
  const routeCtor = (name: string) =>
    class {
      _status = 0
      constructor(_map: any, opts2: any) {
        calls[name as keyof typeof calls] = ((calls[name as keyof typeof calls] as number) ?? 0) + 1
        ;(this as any)._cb = opts2.onSearchComplete
      }
      getStatus() {
        return this._status
      }
      search(from: any, to: any) {
        const empty = name === 'WalkingRoute' && opts.walkEmpty
        const path = empty
          ? []
          : [from, { lng: (from.lng + to.lng) / 2, lat: (from.lat + to.lat) / 2 }, to]
        setTimeout(() => {
          if (empty) this._status = 1
          ;(this as any)._cb({
            getPlan: () => ({
              getDistance: () => 123,
              getRoute: () => ({ getPath: () => path }),
            }),
          })
        }, 0)
      }
    }
  gl.WalkingRoute = routeCtor('WalkingRoute')
  gl.RidingRoute = routeCtor('RidingRoute')
  gl.DrivingRoute = routeCtor('DrivingRoute')
  gl.Geocoder = class {
    getLocation(point: any, cb: any) {
      calls.Geocoder++
      setTimeout(() => {
        cb({
          addressComponents: { street: '测试路', district: '测试区' },
          surroundPois: [{ title: '测试路10号', point: { lng: point.lng + 0.0002, lat: point.lat + 0.0002 } }],
        })
      }, 0)
    }
  }
  return { gl, calls }
}

describe('createBaiduAdapter', () => {
  it('maps walking route results to lnglat path', async () => {
    const { gl, calls } = createFakeGL()
    const adapter = createBaiduAdapter(gl)
    const path = await adapter.route({ lng: 116.4, lat: 39.9 }, { lng: 116.41, lat: 39.91 }, 'walk')
    expect(path.length).toBeGreaterThan(1)
    expect(calls.WalkingRoute).toBe(1)
  })
  it('falls back to riding when walking returns empty', async () => {
    const { gl, calls } = createFakeGL({ walkEmpty: true })
    const adapter = createBaiduAdapter(gl)
    const path = await adapter.route({ lng: 116.4, lat: 39.9 }, { lng: 116.41, lat: 39.91 }, 'walk')
    expect(path.length).toBeGreaterThan(1)
    expect(calls.RidingRoute).toBe(1)
  })
  it('reverseGeocode returns road name and point', async () => {
    const { gl } = createFakeGL()
    const adapter = createBaiduAdapter(gl)
    const r = await adapter.reverseGeocode({ lng: 116.4, lat: 39.9 })
    expect(r.road).toBe('测试路')
    expect(r.point?.lng).toBeCloseTo(116.4002, 6)
  })
  it('rejects after timeout when callback never fires', async () => {    const gl: any = { BMAP_STATUS_SUCCESS: 0, Point: class { constructor(public lng: number, public lat: number) {} } }
    gl.WalkingRoute = class {
      search() {}
      getStatus() {
        return 0
      }
    }
    const adapter = createBaiduAdapter(gl)
    const t0 = Date.now()
    const path = await adapter.route({ lng: 116.4, lat: 39.9 }, { lng: 116.41, lat: 39.91 }, 'walk')
    expect(Date.now() - t0).toBeGreaterThan(1000)
    expect(path).toEqual([])
  }, 30000)
})
