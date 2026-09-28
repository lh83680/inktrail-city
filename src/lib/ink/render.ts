import type { Pt } from '../geo/point'

const MIN_W = 2
const MAX_W = 48

/** 墨线宽度：压感 × 速度（快则枯、慢则润），clamp 到 [2,48]。 */
export function strokeWidthAt(pressure: number, velocityPx: number): number {
  const dryness = Math.min(1, Math.max(0, velocityPx) / 1200)
  const w = MIN_W + (pressure * 46 - MIN_W) * (1 - dryness * 0.85)
  return Math.max(MIN_W, Math.min(MAX_W, w))
}

/** 相邻点的中点序列（二次贝塞尔的控制点）。 */
export function pathMidpoints(points: Pt[]): Pt[] {
  const out: Pt[] = []
  for (let i = 1; i < points.length; i++) {
    out.push({ x: (points[i - 1].x + points[i].x) / 2, y: (points[i - 1].y + points[i].y) / 2 })
  }
  return out
}

/**
 * 锥形墨笔渲染：以中点做二次贝塞尔分段，逐段按压感设线宽。
 * points 需含 pressure/velocity（墨坐标）。
 */
export function drawTaperedStroke(
  ctx: CanvasRenderingContext2D,
  points: { x: number; y: number; pressure: number; velocity: number }[],
  color = '#1F1B16',
): void {
  if (points.length < 2) {
    if (points.length === 1) {
      ctx.fillStyle = color
      ctx.beginPath()
      ctx.arc(points[0].x, points[0].y, Math.max(1, points[0].pressure * 6), 0, Math.PI * 2)
      ctx.fill()
    }
    return
  }
  const mids = pathMidpoints(points)
  ctx.strokeStyle = color
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  ctx.beginPath()
  ctx.moveTo(points[0].x, points[0].y)
  if (points.length === 2) {
    ctx.lineTo(points[1].x, points[1].y)
    ctx.lineWidth = strokeWidthAt(points[0].pressure, points[0].velocity)
    ctx.stroke()
    return
  }
  ctx.quadraticCurveTo(mids[0].x, mids[0].y, mids[1].x, mids[1].y)
  for (let i = 2; i < mids.length; i++) {
    ctx.quadraticCurveTo(points[i - 1].x, points[i - 1].y, mids[i].x, mids[i].y)
  }
  ctx.quadraticCurveTo(
    points[points.length - 2].x,
    points[points.length - 2].y,
    points[points.length - 1].x,
    points[points.length - 1].y,
  )
  ctx.lineWidth = strokeWidthAt(points[0].pressure, points[0].velocity)
  ctx.stroke()
}
