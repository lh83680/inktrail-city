import { strokeWidthAt, pathMidpoints, drawTaperedStroke } from '../../../src/lib/ink/render'

describe('ink render', () => {
  it('fast dry stroke is thinner than slow wet', () => {
    const slow = strokeWidthAt(0.8, 10)
    const fast = strokeWidthAt(0.8, 900)
    expect(fast).toBeLessThan(slow * 0.5)
  })
  it('width stays in clamp range', () => {
    expect(strokeWidthAt(0, 0)).toBeGreaterThanOrEqual(2)
    expect(strokeWidthAt(1, 0)).toBeLessThanOrEqual(48)
  })
  it('midpoints of a straight line lie on it', () => {
    const m = pathMidpoints([
      { x: 0, y: 0 },
      { x: 10, y: 0 },
      { x: 20, y: 0 },
    ])
    expect(m).toHaveLength(2)
    m.forEach((p) => expect(p.y).toBe(0))
  })
  it('draws two-point stroke without crashing', () => {
    const ctx = { beginPath: () => {}, moveTo: () => {}, lineTo: () => {}, quadraticCurveTo: () => {}, stroke: () => {}, fill: () => {}, arc: () => {}, set lineWidth(_v: number) {}, set strokeStyle(_v: string) {}, set strokeStyle2(_v: string) {}, set lineCap(_v: string) {}, set lineJoin(_v: string) {}, set fillStyle(_v: string) {} } as unknown as CanvasRenderingContext2D
    expect(() =>
      drawTaperedStroke(ctx, [
        { x: 0, y: 0, pressure: 0.5, velocity: 100 },
        { x: 10, y: 0, pressure: 0.5, velocity: 100 },
      ]),
    ).not.toThrow()
  })
})
