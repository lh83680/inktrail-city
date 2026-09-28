import type { LngLat, Pt } from '../geo/point'

export type { LngLat, Pt }

/** 一笔手写（墨坐标点串，pressure/velocity 用于墨韵渲染） */
export interface StrokePoint extends Pt {
  pressure: number
  velocity: number
  t: number
}
export interface Stroke {
  points: StrokePoint[]
}

/** 字形/手写产出的保序锚点多段线：strokes[i] = 第 i 笔的有序锚点 */
export interface AnchorSet {
  strokes: LngLat[][]
}

export type SegmentKind = 'stroke' | 'connector' | 'fallback'

export interface Segment {
  path: LngLat[]
  from: LngLat
  to: LngLat
  kind: SegmentKind
}

export interface CompiledRoute {
  segments: Segment[]
  path: LngLat[]
  distanceM: number
  walkMin: number
  /** 0..1，stroke 段对原始笔画的保真度 */
  fidelity: number
  /** 编译过程中的提示（fallback、snap 失败等），空数组=干净 */
  note: string[]
  /** 沿线 POI（复用贴路的逆地理编码结果，零额外请求） */
  pois: { title: string; point: LngLat }[]
  /** 原始字形笔画（米制经纬，供渲染层叠加"意图"轮廓） */
  idealStrokes: LngLat[][]
}

export type TravelMode = 'walk' | 'ride' | 'drive'

export interface CompileParams {
  density: 'dense' | 'sparse'
  mode: TravelMode
}
