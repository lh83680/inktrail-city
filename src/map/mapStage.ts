import type { LngLat } from '../lib/geo/point'
import type { CompiledRoute, TravelMode } from '../lib/compile/types'

export interface PaperStyle {
  styleJson: any[]
}

export interface MapStageOptions {
  ak: string
  style: PaperStyle
  /** 测试注入；缺省用 window.BMapGL */
  gl?: any
  center?: LngLat
  zoom?: number
}

export interface RenderOpts {
  /** 已点亮的段数（0..segments.length） */
  litSegment: number
  mode: TravelMode
  /** 原始字形笔画（叠一层"意图"轮廓，保证字形可读） */
  idealStrokes?: LngLat[][]
}

export interface MapStage {
  map: any
  render(route: CompiledRoute, opts: RenderOpts): void
  fit(path: LngLat[]): void
  clear(): void
  debugState(): { polylines: { opacity: number }[]; markers: number }
}

const GOLD = '#C9A227'
const DIM_OPACITY = 0.16

/** 宣纸墨色 + 金线路线的地图舞台。 */
export function createMapStage(container: HTMLElement, opts: MapStageOptions): MapStage {
  const gl = opts.gl ?? (window as any).BMapGL
  const map = new gl.Map(container, {
    enableRotate: true,
    enableTilt: true,
    minZoom: 4,
    maxZoom: 19,
  })
  const center = opts.center ?? { lng: 116.404, lat: 39.915 }
  map.centerAndZoom(new gl.Point(center.lng, center.lat), opts.zoom ?? 12)
  map.enableScrollWheelZoom(true)
  try {
    map.setMapStyleV2(opts.style)
  } catch {
    /* 旧版本 GL 不支持时忽略，保持默认底图 */
  }

  const polylines: any[] = []
  const markers: any[] = []
  const P = (p: LngLat) => new gl.Point(p.lng, p.lat)

  return {
    map,
    render(route: CompiledRoute, r: RenderOpts) {
      this.clear()
      route.segments.forEach((seg, i) => {
        const lit = i < r.litSegment
        const glow = new gl.Polyline(seg.path.map(P), {
          strokeColor: GOLD,
          strokeWeight: 20,
          strokeOpacity: lit ? 0.28 : DIM_OPACITY * 0.5,
          enableMassClear: true,
        })
        const solid = new gl.Polyline(seg.path.map(P), {
          strokeColor: GOLD,
          strokeWeight: 7,
          strokeOpacity: lit ? 0.95 : DIM_OPACITY,
          enableMassClear: true,
          strokeStyle: seg.kind === 'connector' ? 'dashed' : 'solid',
        })
        polylines.push(glow, solid)
        map.addOverlay(glow)
        map.addOverlay(solid)
      })
      if (route.segments.length > 0) {
        const first = route.segments[0]
        const last = route.segments[route.segments.length - 1]
        const start = new gl.Marker(P(first.from), {})
        const end = new gl.Marker(P(last.to), {})
        markers.push(start, end)
        map.addOverlay(start)
        map.addOverlay(end)
      }
      // 理想字形轮廓：细墨线压阵（路线是城市的回答，这是书者的意图）
      for (const stroke of r.idealStrokes ?? []) {
        if (stroke.length < 2) continue
        const outline = new gl.Polyline(stroke.map(P), {
          strokeColor: '#1F1B16',
          strokeWeight: 3,
          strokeOpacity: 0.5,
          enableMassClear: true,
        })
        polylines.push(outline)
        map.addOverlay(outline)
      }
    },
    fit(path: LngLat[]) {
      if (path.length === 0) return
      // GL 版 setViewport 收 Point[]（Bounds 对象在 GL 下是空操作）
      map.setViewport(path.map(P))
    },
    clear() {
      map.clearOverlays()
      polylines.length = 0
      markers.length = 0
    },
    debugState() {
      return {
        polylines: polylines.map((p) => ({ opacity: p.opts.strokeOpacity as number })),
        markers: markers.length,
      }
    },
  }
}
