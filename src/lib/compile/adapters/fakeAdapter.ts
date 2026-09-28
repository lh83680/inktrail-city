import type { MapAdapter } from './mapAdapter'
import type { LngLat } from '../../geo/point'
import type { TravelMode } from '../types'

export interface FakeAdapter extends MapAdapter {
  calls: { route: number; reverse: number }
  maxConcurrent: number
}

export interface FakeOptions {
  /** 前 N 次 route 调用失败 */
  failNext?: number
  /** 每次 route 延迟 ms（并发观测用） */
  delayMs?: number
  /** reverseGeocode 始终失败 */
  failReverse?: boolean
  /** 吸附偏移半径（米，向北） */
  snapOffsetM?: number
}

const M_PER_DEG_LAT = 111320

/** 测试用假适配器：route 返两点直线；reverseGeocode 返回锚点正北 snapOffsetM 处的稳定道路点。 */
export function createFakeAdapter(opts: FakeOptions = {}): FakeAdapter {
  let routeFails = opts.failNext ?? 0
  const delayMs = opts.delayMs ?? 0
  const snapOffsetM = opts.snapOffsetM ?? 20
  let inFlight = 0
  const adapter: FakeAdapter = {
    calls: { route: 0, reverse: 0 },
    maxConcurrent: 0,
    async route(from: LngLat, to: LngLat, _mode: TravelMode): Promise<LngLat[]> {
      adapter.calls.route++
      inFlight++
      adapter.maxConcurrent = Math.max(adapter.maxConcurrent, inFlight)
      try {
        if (delayMs > 0) await new Promise((r) => setTimeout(r, delayMs))
        if (routeFails > 0) {
          routeFails--
          throw new Error('fake route failure')
        }
        return [from, to]
      } finally {
        inFlight--
      }
    },
    async reverseGeocode(p: LngLat): Promise<{ road?: string; poi?: string; point?: LngLat }> {
      adapter.calls.reverse++
      if (opts.failReverse) throw new Error('fake reverse failure')
      return {
        road: `测试路${Math.round(p.lat * 1000)}号`,
        poi: 'POI' + Math.round(p.lng * 1000),
        point: { lng: p.lng, lat: p.lat + snapOffsetM / M_PER_DEG_LAT },
      }
    },
    async searchNearby(_kw: string, center: LngLat): Promise<{ title: string; point: LngLat }[]> {
      return [{ title: `测试商户-${Math.round(center.lng * 1000)}-${Math.round(center.lat * 1000)}`, point: center }]
    },
  }
  return adapter
}
