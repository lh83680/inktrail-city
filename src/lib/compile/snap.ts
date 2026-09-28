import { toMeters } from '../geo/point'
import type { LngLat } from '../geo/point'
import type { MapAdapter } from './adapters/mapAdapter'

export interface SnapResult {
  anchor: LngLat
  snapM: number
  /** 最近道路 POI 名称（故事卡数据源，复用同一次逆地理编码） */
  title?: string
}

/** 保序贴路：并发<=4 调 reverseGeocode；失败或越界回退原锚点。 */
export async function snapAnchors(anchors: LngLat[], adapter: MapAdapter): Promise<SnapResult[]> {
  const pool = 4
  const results: SnapResult[] = new Array(anchors.length)
  let idx = 0
  async function worker() {
    while (idx < anchors.length) {
      const i = idx++
      const a = anchors[i]
      try {
        const geo = await adapter.reverseGeocode(a)
        if (!geo.point) {
          results[i] = { anchor: a, snapM: Infinity }
          continue
        }
        const m = toMeters(geo.point, a)
        const d = Math.hypot(m.x, m.y)
        results[i] = d <= 40 ? { anchor: geo.point, snapM: d, title: geo.poi ?? geo.road } : { anchor: a, snapM: d }
      } catch {
        results[i] = { anchor: a, snapM: Infinity }
      }
    }
  }
  await Promise.all(Array.from({ length: Math.min(pool, anchors.length) }, worker))
  return results
}
