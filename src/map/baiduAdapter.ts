import type { MapAdapter, GeoPoint, PoiHit } from '../lib/compile/adapters/mapAdapter'
import type { LngLat } from '../lib/geo/point'
import type { TravelMode } from '../lib/compile/types'

interface RouteInstance {
  search(from: LngLat, to: LngLat): void
  getStatus?(): number
}

const ROUTE_TIMEOUT_MS = 12000

/** 用 BMapGL 回调式 API 实现的真实地图适配器（window.BMapGL 注入）。 */
export function createBaiduAdapter(gl: any, map?: any): MapAdapter {
  const MODE_CHAIN: Record<TravelMode, TravelMode[]> = {
    walk: ['ride', 'drive'],
    ride: ['drive'],
    drive: [],
  }

  function callRoute(Cls: any, from: LngLat, to: LngLat): Promise<LngLat[]> {
    return new Promise((resolve, reject) => {
      let settled = false
      const done = (fn: () => void) => {
        if (settled) return
        settled = true
        clearTimeout(timer)
        fn()
      }
      const timer = setTimeout(() => done(() => reject(new Error('route timeout'))), ROUTE_TIMEOUT_MS)
      try {
        const inst: RouteInstance = new Cls(map ?? null, {
          // renderOptions.map 置空：让 GL 不渲染自带的结果标记/折线（我们自己画金线）
          renderOptions: { autoViewport: false },
          onSearchComplete: (results: any) => {
            const status = inst.getStatus?.()
            if (status !== undefined && status !== 0) {
              done(() => resolve([]))
              return
            }
            const plan = results?.getPlan?.(0)
            const route = plan?.getRoute?.(0)
            const path = (route?.getPath?.() as any[] | undefined) ?? []
            done(() => resolve(path.length >= 2 ? path.map((p) => ({ lng: p.lng, lat: p.lat })) : []))
          },
          onError: (err: any) => done(() => reject((err as Error) ?? new Error('route error'))),
        })
        inst.search(new gl.Point(from.lng, from.lat), new gl.Point(to.lng, to.lat))
      } catch (e) {
        done(() => reject(e instanceof Error ? e : new Error('route ctor failed')))
      }
    })
  }

  return {
    async route(from: LngLat, to: LngLat, mode: TravelMode): Promise<LngLat[]> {
      const modes = [mode, ...MODE_CHAIN[mode]]
      for (const m of modes) {
        const Cls = m === 'walk' ? gl.WalkingRoute : m === 'ride' ? gl.RidingRoute : gl.DrivingRoute
        if (!Cls) continue
        try {
          const path = await callRoute(Cls, from, to)
          if (path.length >= 2) return path
        } catch {
          /* 尝试下一模式 */
        }
      }
      return []
    },

    reverseGeocode(p: LngLat): Promise<GeoPoint> {
      return new Promise((resolve) => {
        const timer = setTimeout(() => resolve({ point: p }), 8000)
        try {
          new gl.Geocoder().getLocation(new gl.Point(p.lng, p.lat), (r: any) => {
            clearTimeout(timer)
            const road = r?.addressComponents?.street
            const roadPoi = r?.surroundPois?.find((x: any) => /路|街|巷|道/.test(x?.title ?? '')) ?? r?.surroundPois?.[0]
            resolve({
              road: road || roadPoi?.title,
              poi: r?.surroundPois?.[0]?.title,
              point: roadPoi?.point ?? p,
            })
          })
        } catch {
          clearTimeout(timer)
          resolve({ point: p })
        }
      })
    },

    searchNearby(keyword: string, center: LngLat, radiusM: number): Promise<PoiHit[]> {
      return new Promise((resolve) => {
        const timer = setTimeout(() => resolve([]), 10000)
        try {
          const ls = new gl.LocalSearch(map ?? null, {
            onSearchComplete: (rs: any) => {
              clearTimeout(timer)
              const out: PoiHit[] = []
              const num = rs?.getCurrentNumPois?.() ?? 0
              for (let i = 0; i < num; i++) {
                const poi = rs.getPoi(i)
                if (poi?.point) out.push({ title: poi.title, point: { lng: poi.point.lng, lat: poi.point.lat } })
              }
              resolve(out)
            },
          })
          ls.searchNearby(keyword, new gl.Point(center.lng, center.lat), radiusM)
        } catch {
          clearTimeout(timer)
          resolve([])
        }
      })
    },
  }
}
