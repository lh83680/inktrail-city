import { toMeters, pathLengthM } from '../geo/point'
import type { LngLat, Pt } from '../geo/point'
import { simplifyDP } from './simplify'
import { resampleAdaptive } from './resample'
import { snapAnchors } from './snap'
import { compileSegments } from './routeEngine'
import { connectorPairs } from './connectors'
import { layoutChars, type CharBox } from './layout'
import { fidelity } from './hausdorff'
import type { AnchorSet, CompiledRoute, CompileParams, Segment, Stroke } from './types'
import type { MapAdapter } from './adapters/mapAdapter'

export interface CompileInput {
  text: string
  /** 手写笔画（viewport 像素坐标）；空 = 用字库 */
  strokes: Stroke[]
  adapter: MapAdapter
  params: CompileParams
  center: LngLat
  metersPerPx: number
  /** 字库提供器（默认内置骨架，任务 17 起接真实字库）；box 为该字在视口中的排版方格 */
  glyphProvider?: (char: string, index: number, box: CharBox) => AnchorSet
  viewport?: { width: number; height: number }
}

const WALK_M_PER_MIN = 72
const MAX_ANCHORS_PER_STROKE = 12
const MAX_TOTAL_ANCHORS = 120

/** 锚点上限控制：超限时等距抽稀（保首末），保证单作算路请求数受控。 */
function capAnchors(anchors: LngLat[], max: number): LngLat[] {
  if (anchors.length <= max) return anchors
  const out: LngLat[] = []
  const step = (anchors.length - 1) / (max - 1)
  for (let i = 0; i < max; i++) out.push(anchors[Math.round(i * step)])
  return out
}

function projectStroke(stroke: Stroke, center: LngLat, metersPerPx: number): LngLat[] {
  const k = Math.cos((center.lat * Math.PI) / 180)
  return stroke.points.map((p) => ({
    lng: center.lng + ((p.x - 200) * metersPerPx) / (111320 * k),
    lat: center.lat + ((p.y - 200) * metersPerPx) / 111320,
  }))
}

/** 默认字库骨架：以 center 为原点的 X 形四锚点（任务 17 替换为真实字形）。 */
function defaultGlyph(char: string, index: number): AnchorSet {
  const dLat = (i: number) => (i * 100) / 111320
  const dLng = (i: number) => (i * 100) / (111320 * Math.cos((39.915 * Math.PI) / 180))
  const chars = [...char]
  const off = index * 0.002
  void chars
  const p = (i: number, j: number): LngLat => ({ lng: 116.404 + off + dLng(i), lat: 39.915 + dLat(j) })
  return {
    strokes: [
      [p(0, 0), p(100, 100)],
      [p(100, 0), p(0, 100)],
    ],
  }
}

/** 预处理：DP 简化 → 自适应重采样（墨坐标近似用米）。 */
function prepareStroke(points: LngLat[], tolerance: number, targetGap: number, center: LngLat): LngLat[] {
  const ref = center
  const pts: Pt[] = points.map((p) => toMeters(p, ref))
  const simplified = simplifyDP(pts, tolerance)
  const resampled = resampleAdaptive(simplified, targetGap)
  return resampled.map((m) => ({
    lng: ref.lng + m.x / (111320 * Math.cos((ref.lat * Math.PI) / 180)),
    lat: ref.lat + m.y / 111320,
  }))
}

/** 锚点间距：字库来源用粗档（100m），手写来源用默认（80m）。 */
function anchorGapFor(input: CompileInput): number {
  return input.strokes.length > 0 ? 60 : 50
}

/** 全链路：锚点 → 贴路 → 分段算路(+连接段) → 融合 → 失真度量。 */
export async function compileWork(input: CompileInput): Promise<CompiledRoute> {
  const { text, adapter, params } = input
  const chars = [...text]
  const tolerance = params.density === 'dense' ? 25 : 40
  const targetGap = anchorGapFor(input)

  const anchorSets: AnchorSet[] = []
  const originalPolylines: LngLat[][] = []

  if (input.strokes.length > 0) {
    for (const stroke of input.strokes) {
      const projected = projectStroke(stroke, input.center, input.metersPerPx)
      originalPolylines.push(projected)
      anchorSets.push({ strokes: [projected] })
    }
  } else {
    const viewport = input.viewport ?? { width: 800, height: 600 }
    const boxes = layoutChars(chars.join(''), viewport)
    chars.forEach((ch, i) => {
      const set = input.glyphProvider?.(ch, i, boxes[i].box) ?? defaultGlyph(ch, i)
      anchorSets.push(set)
      originalPolylines.push(...set.strokes)
    })
  }

  const prepared: AnchorSet = { strokes: [] }
  const notes: string[] = []
  for (const set of anchorSets) {
    for (const stroke of set.strokes) {
      prepared.strokes.push(capAnchors(prepareStroke(stroke, tolerance, targetGap, input.center), MAX_ANCHORS_PER_STROKE))
    }
  }
  const totalAnchors = prepared.strokes.reduce((n, s) => n + s.length, 0)
  if (totalAnchors > MAX_TOTAL_ANCHORS) notes.push(`anchors-capped:${totalAnchors}>${MAX_TOTAL_ANCHORS}`)

  const requests: { from: LngLat; to: LngLat; kind: Segment['kind'] }[] = []
  const poiMap = new Map<string, LngLat>()
  for (const anchors of prepared.strokes) {
    const snapped = await snapAnchors(anchors, adapter)
    for (const s of snapped) {
      if (s.title && poiMap.size < 24 && !poiMap.has(s.title)) poiMap.set(s.title, s.anchor)
    }
    for (let j = 1; j < snapped.length; j++) {
      requests.push({ from: snapped[j - 1].anchor, to: snapped[j].anchor, kind: 'stroke' })
    }
  }

  for (const cp of connectorPairs(anchorSets)) {
    requests.push({ from: cp.from, to: cp.to, kind: 'connector' })
  }

  const { segments, path, fallbackCount, note: engineNote } = await compileSegments(requests, adapter, {
    pool: 5,
    retry: 1,
    cooldownMs: 80,
    mergeM: 30,
  })
  if (fallbackCount > 0) notes.push(`fallback-total:${fallbackCount}`)
  const note = [...notes, ...engineNote]

  // 失真：原始笔划线（米制、采样 150） vs stroke 段路线
  const ref = input.center
  const toPt = (p: LngLat) => toMeters(p, ref)
  const strokeRoute = segments
    .filter((s) => s.kind === 'stroke')
    .flatMap((s) => s.path.map(toPt))
  const originalPts = originalPolylines.flat().map(toPt)
  const f = strokeRoute.length > 1 ? fidelity(originalPts, strokeRoute) : 0

  const distanceM = pathLengthM(path)
  return {
    segments,
    path,
    distanceM,
    walkMin: Math.round(distanceM / WALK_M_PER_MIN),
    fidelity: Math.round(f * 100) / 100,
    note,
    pois: [...poiMap].map(([title, point]) => ({ title, point })),
    idealStrokes: originalPolylines,
  }
}
