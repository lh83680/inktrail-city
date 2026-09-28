import type { Pt } from '../geo/point'

/** 等弧长重采样多段线为 n 个点（含首末）。 */
export function samplePolyline(points: Pt[], n: number): Pt[] {
  if (points.length === 0) return []
  if (points.length === 1) return [points[0]]
  if (n <= 2) return [points[0], points[points.length - 1]]

  const segs: number[] = []
  let total = 0
  for (let i = 1; i < points.length; i++) {
    const d = Math.hypot(points[i].x - points[i - 1].x, points[i].y - points[i - 1].y)
    segs.push(d)
    total += d
  }
  if (total === 0) return Array.from({ length: n }, () => ({ ...points[0] }))

  const out: Pt[] = [points[0]]
  const step = total / (n - 1)
  let segIdx = 0
  let segStart = 0
  for (let k = 1; k < n - 1; k++) {
    const target = k * step
    while (segIdx < segs.length - 1 && segStart + segs[segIdx] < target) {
      segStart += segs[segIdx]
      segIdx++
    }
    const remain = segs[segIdx]
    const t = remain === 0 ? 0 : (target - segStart) / remain
    out.push({
      x: points[segIdx].x + (points[segIdx + 1].x - points[segIdx].x) * t,
      y: points[segIdx].y + (points[segIdx + 1].y - points[segIdx].y) * t,
    })
  }
  out.push(points[points.length - 1])
  return out
}

function pointToSegmentsDist(p: Pt, a: Pt, b: Pt): number {
  const dx = b.x - a.x
  const dy = b.y - a.y
  const len2 = dx * dx + dy * dy
  if (len2 === 0) return Math.hypot(p.x - a.x, p.y - a.y)
  let t = ((p.x - a.x) * dx + (p.y - a.y) * dy) / len2
  t = Math.max(0, Math.min(1, t))
  return Math.hypot(p.x - (a.x + t * dx), p.y - (a.y + t * dy))
}

function directedDist(from: Pt[], to: Pt[]): number {
  let max = 0
  for (const p of from) {
    let min = Infinity
    for (let i = 1; i < to.length; i++) {
      const d = pointToSegmentsDist(p, to[i - 1], to[i])
      if (d < min) min = d
    }
    if (min > max) max = min
  }
  return max
}

/** 双向 Hausdorff 距离（米）。 */
export function hausdorffM(a: Pt[], b: Pt[]): number {
  if (a.length === 0 || b.length === 0) return Infinity
  return Math.max(directedDist(a, b), directedDist(b, a))
}

/** 笔画采样点落入路线 bufferM 缓冲区的比例（0..1）。 */
export function fidelity(strokePts: Pt[], routePts: Pt[], bufferM = 60): number {
  if (strokePts.length === 0) return 1
  let hit = 0
  for (const p of strokePts) {
    let min = Infinity
    for (let i = 1; i < routePts.length; i++) {
      const d = pointToSegmentsDist(p, routePts[i - 1], routePts[i])
      if (d < min) min = d
    }
    if (min <= bufferM) hit++
  }
  return hit / strokePts.length
}
