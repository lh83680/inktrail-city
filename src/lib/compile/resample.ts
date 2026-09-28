import type { Pt } from '../geo/point'

/**
 * 曲率自适应等距重采样。
 * targetGapM 基准间距；曲率大处加密到 minGapM，平直处放宽到 maxGapM；
 * 曲率超过阈值的原始顶点强制保留（角点是字形骨架）。
 */
export function resampleAdaptive(
  points: Pt[],
  targetGapM: number,
  minGapM = targetGapM / 2,
  maxGapM = targetGapM * 2,
): Pt[] {
  if (points.length < 3) return [...points]

  const curv: number[] = [0]
  for (let i = 1; i < points.length - 1; i++) {
    const a = points[i - 1]
    const b = points[i]
    const c = points[i + 1]
    const ux = b.x - a.x
    const uy = b.y - a.y
    const vx = c.x - b.x
    const vy = c.y - b.y
    const lu = Math.hypot(ux, uy)
    const lv = Math.hypot(vx, vy)
    if (lu < 1e-9 || lv < 1e-9) {
      curv.push(0)
      continue
    }
    const cos = Math.max(-1, Math.min(1, (ux * vx + uy * vy) / (lu * lv)))
    curv.push(1 - cos)
  }
  curv.push(0)

  const gapAt = (i: number) => {
    const k = Math.min(1, curv[i] / 0.7)
    return maxGapM + (minGapM - maxGapM) * k
  }
  // 只保留急转折点（接近原路返回的角点），避免密集轮廓产生过多锚点
  const forced = (i: number) => curv[i] >= 1.5

  const segs: number[] = []
  let total = 0
  for (let i = 1; i < points.length; i++) {
    const d = Math.hypot(points[i].x - points[i - 1].x, points[i].y - points[i - 1].y)
    segs.push(d)
    total += d
  }
  const posAt = (target: number): Pt => {
    let acc = 0
    for (let i = 0; i < segs.length; i++) {
      if (acc + segs[i] >= target || i === segs.length - 1) {
        const t = segs[i] === 0 ? 0 : (target - acc) / segs[i]
        return {
          x: points[i].x + (points[i + 1].x - points[i].x) * t,
          y: points[i].y + (points[i + 1].y - points[i].y) * t,
        }
      }
      acc += segs[i]
    }
    return points[points.length - 1]
  }

  const out: Pt[] = [points[0]]
  let lastEmit = 0
  let cursor = 0
  for (let j = 1; j < points.length; j++) {
    const edgeEnd = cursor + segs[j - 1]
    const gap = gapAt(j - 1)
    let next = lastEmit + gap
    while (next <= edgeEnd - 1e-9) {
      out.push(posAt(next))
      lastEmit = next
      next = lastEmit + gap
    }
    if (j < points.length - 1 && forced(j) && Math.abs(lastEmit - edgeEnd) > 0.5) {
      out.push(points[j])
      lastEmit = edgeEnd
    }
    cursor = edgeEnd
  }
  const last = points[points.length - 1]
  if (total - lastEmit >= gapAt(points.length - 2) * 0.5) out.push(last)
  else out[out.length - 1] = last
  return out
}
