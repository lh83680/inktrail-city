import type { Pt } from '../geo/point'

/** Douglas-Peucker 折线简化。输入输出保持首末点。 */
export function simplifyDP(points: Pt[], toleranceM: number): Pt[] {
  if (points.length <= 2) return [...points]
  const keep = new Uint8Array(points.length)
  keep[0] = 1
  keep[points.length - 1] = 1
  const stack: [number, number][] = [[0, points.length - 1]]
  const tol2 = toleranceM * toleranceM
  while (stack.length) {
    const [first, last] = stack.pop()!
    if (last - first < 2) continue
    const a = points[first]
    const b = points[last]
    const dx = b.x - a.x
    const dy = b.y - a.y
    const len2 = dx * dx + dy * dy
    let maxDist2 = -1
    let idx = -1
    for (let i = first + 1; i < last; i++) {
      const p = points[i]
      let dist2: number
      if (len2 === 0) {
        dist2 = (p.x - a.x) ** 2 + (p.y - a.y) ** 2
      } else {
        let t = ((p.x - a.x) * dx + (p.y - a.y) * dy) / len2
        t = Math.max(0, Math.min(1, t))
        const cx = a.x + t * dx
        const cy = a.y + t * dy
        dist2 = (p.x - cx) ** 2 + (p.y - cy) ** 2
      }
      if (dist2 > maxDist2) {
        maxDist2 = dist2
        idx = i
      }
    }
    if (idx >= 0 && maxDist2 > tol2) {
      keep[idx] = 1
      stack.push([first, idx], [idx, last])
    }
  }
  return points.filter((_, i) => keep[i] === 1)
}
