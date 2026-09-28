import { toMeters, pathLengthM } from '../geo/point'
import type { LngLat } from '../geo/point'
import type { MapAdapter } from './adapters/mapAdapter'
import type { Segment, TravelMode } from './types'

export interface SegRequest {
  from: LngLat
  to: LngLat
  kind: Segment['kind']
}

export interface EngineOpts {
  pool: number
  retry: number
  cooldownMs: number
  mergeM: number
}

export interface EngineResult {
  segments: Segment[]
  path: LngLat[]
  fallbackCount: number
  note: string[]
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

/** 分段算路：并发池 + 重试 + 降级直线段；按输入顺序融合拼接、端点去重。 */
export async function compileSegments(
  requests: SegRequest[],
  adapter: MapAdapter,
  opts: EngineOpts,
): Promise<EngineResult> {
  const out: (Segment | null)[] = new Array(requests.length)
  const note: string[] = []
  let fallbackCount = 0
  let idx = 0

  async function runOne(req: SegRequest, mode: TravelMode): Promise<LngLat[] | null> {
    let lastErr: unknown = null
    for (let attempt = 0; attempt <= opts.retry; attempt++) {
      try {
        if (opts.cooldownMs > 0) await sleep(opts.cooldownMs)
        const path = await adapter.route(req.from, req.to, mode)
        if (path && path.length >= 2) return path
        lastErr = new Error('empty route')
      } catch (e) {
        lastErr = e
      }
    }
    void lastErr
    return null
  }

  async function worker() {
    while (idx < requests.length) {
      const i = idx++
      const req = requests[i]
      let path = await runOne(req, req.kind === 'fallback' ? 'walk' : 'walk')
      if (!path) path = await runOne(req, 'ride')
      if (!path) path = await runOne(req, 'drive')
      if (!path) {
        out[i] = { path: [req.from, req.to], from: req.from, to: req.to, kind: 'fallback' }
        fallbackCount++
        note.push(`fallback:segment-${i}`)
      } else {
        out[i] = { path, from: req.from, to: req.to, kind: req.kind }
      }
    }
  }

  await Promise.all(Array.from({ length: Math.min(opts.pool, requests.length) }, worker))

  const segments = out.filter((s): s is Segment => s !== null)
  const path: LngLat[] = []
  for (const seg of segments) {
    for (const p of seg.path) {
      const prev = path[path.length - 1]
      if (prev) {
        const m = toMeters(p, prev)
        if (Math.hypot(m.x, m.y) < opts.mergeM) {
          path[path.length - 1] = p
          continue
        }
      }
      path.push(p)
    }
  }
  return { segments, path, fallbackCount, note }
}

/** 距离统计（米）。 */
export function routeDistanceM(path: LngLat[]): number {
  return pathLengthM(path)
}
