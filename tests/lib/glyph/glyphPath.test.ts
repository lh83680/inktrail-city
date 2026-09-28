import { loadGlyphFont } from '../../../src/lib/glyph/glyphPath'

describe('glyphPath', () => {
  it('parses 福 into multiple ordered strokes', async () => {
    const f = await loadGlyphFont('public/assets/fonts/ink-glyphs.ttf')
    const strokes = f.path('福', 100)
    expect(strokes.length).toBeGreaterThanOrEqual(9)
    strokes.forEach((s) => expect(s.length).toBeGreaterThan(1))
  })
  it('normalizes to 0..scale box', async () => {
    const f = await loadGlyphFont('public/assets/fonts/ink-glyphs.ttf')
    const pts = f.path('一', 100).flat()
    const xs = pts.map((p) => p.x)
    const ys = pts.map((p) => p.y)
    expect(Math.min(...xs)).toBeGreaterThanOrEqual(-0.01)
    expect(Math.max(...xs)).toBeLessThanOrEqual(100.01)
    expect(Math.max(...ys)).toBeLessThanOrEqual(100.01)
  })
  it('missing char throws typed error', async () => {
    const f = await loadGlyphFont('public/assets/fonts/ink-glyphs.ttf')
    expect(() => f.path('龘', 100)).toThrow(/glyph-missing/)
  })
})
