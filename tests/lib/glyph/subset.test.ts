import { buildGlyphCharSet } from '../../../src/lib/glyph/subsetChars'

describe('glyph char set', () => {
  it('contains demo chars', () => {
    const s = buildGlyphCharSet()
    expect(s).toContain('福')
    expect(s).toContain('♥')
  })
  it('has no duplicates and size in range', () => {
    const s = buildGlyphCharSet()
    expect(new Set(s).size).toBe(s.length)
    expect(s.length).toBeGreaterThan(3000)
  })
})
