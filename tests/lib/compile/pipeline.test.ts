import { compileWork } from '../../../src/lib/compile/pipeline'
import { createFakeAdapter } from '../../../src/lib/compile/adapters/fakeAdapter'
import type { Stroke } from '../../../src/lib/compile/types'

const center = { lng: 116.404, lat: 39.915 }

// 近直笔画：600m 横笔 + 尾端折转（真实汉字笔画的简化形态）
const makeStroke = (): Stroke => ({
  points: Array.from({ length: 40 }, (_, i) => ({
    x: i * 15,
    y: i < 30 ? 0 : (i - 30) * 12,
    pressure: 0.5,
    velocity: 100,
    t: i,
  })),
})

describe('compileWork', () => {
  it('compiles single-char work end-to-end with fake adapter', async () => {
    const fake = createFakeAdapter({ snapOffsetM: 20 })
    const r = await compileWork({
      text: '福',
      strokes: [makeStroke()],
      adapter: fake,
      params: { density: 'dense', mode: 'walk' },
      center,
      metersPerPx: 10,
    })
    expect(r.path.length).toBeGreaterThan(2)
    expect(r.distanceM).toBeGreaterThan(100)
    expect(r.fidelity).toBeGreaterThanOrEqual(0.78)
    expect(r.note).toEqual([])
  })
  it('two-char work includes connector segment', async () => {
    const fake = createFakeAdapter()
    const r = await compileWork({
      text: '一二',
      strokes: [],
      adapter: fake,
      params: { density: 'sparse', mode: 'ride' },
      center,
      metersPerPx: 10,
    })
    expect(r.segments.some((s) => s.kind === 'connector')).toBe(true)
  })
  it('notes fallback but still returns route', async () => {
    const fake = createFakeAdapter({ failNext: 99 })
    const r = await compileWork({
      text: '一',
      strokes: [{ points: [{ x: 0, y: 0, pressure: 0.5, velocity: 0, t: 0 }, { x: 100, y: 0, pressure: 0.5, velocity: 0, t: 1 }, { x: 200, y: 0, pressure: 0.5, velocity: 0, t: 2 }] }],
      adapter: fake,
      params: { density: 'dense', mode: 'walk' },
      center,
      metersPerPx: 10,
    })
    expect(r.note.join()).toContain('fallback')
    expect(r.path.length).toBeGreaterThan(0)
  })
  it('walk minutes follows 72 m/min pace', async () => {
    const fake = createFakeAdapter()
    const r = await compileWork({
      text: '一',
      strokes: [],
      adapter: fake,
      params: { density: 'dense', mode: 'walk' },
      center,
      metersPerPx: 10,
    })
    expect(r.walkMin).toBe(Math.round(r.distanceM / 72))
  })
})
