import { layoutChars } from '../../../src/lib/compile/layout'
import { connectorPairs } from '../../../src/lib/compile/connectors'
import type { AnchorSet } from '../../../src/lib/compile/types'

describe('layoutChars', () => {
  it('lays chars left-to-right within viewport', () => {
    const boxes = layoutChars('上海', { width: 800, height: 600 })
    expect(boxes.map((b) => b.char)).toEqual(['上', '海'])
    expect(boxes[0].box.x).toBeLessThan(boxes[1].box.x)
    boxes.forEach((b) => {
      expect(b.box.x).toBeGreaterThanOrEqual(0)
      expect(b.box.x + b.box.w).toBeLessThanOrEqual(800)
      expect(b.box.y).toBeGreaterThanOrEqual(0)
      expect(b.box.y + b.box.h).toBeLessThanOrEqual(600)
    })
  })
  it('wraps long phrases into rows', () => {
    const boxes = layoutChars('一二三四五六七八九十', { width: 400, height: 600 })
    const rows = new Set(boxes.map((b) => b.box.y))
    expect(rows.size).toBeGreaterThan(1)
  })
  it('keeps square boxes', () => {
    const [first] = layoutChars('福', { width: 800, height: 600 })
    expect(first.box.w).toBeCloseTo(first.box.h, 6)
    expect(first.box.w).toBeGreaterThan(0)
  })
})

describe('connectorPairs', () => {
  it('links end of char i to start of char i+1', () => {
    const sets: AnchorSet[] = [
      { strokes: [[{ lng: 116.4, lat: 39.9 }, { lng: 116.41, lat: 39.9 }]] },
      { strokes: [[{ lng: 116.42, lat: 39.92 }, { lng: 116.43, lat: 39.92 }]] },
    ]
    const pairs = connectorPairs(sets)
    expect(pairs).toHaveLength(1)
    expect(pairs[0].i).toBe(0)
    expect(pairs[0].from).toEqual({ lng: 116.41, lat: 39.9 })
    expect(pairs[0].to).toEqual({ lng: 116.42, lat: 39.92 })
  })
  it('no connector for single char', () => {
    expect(connectorPairs([{ strokes: [[{ lng: 0, lat: 0 }, { lng: 1, lat: 1 }]] }])).toHaveLength(0)
  })
})
