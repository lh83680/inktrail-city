import { simplifyDP } from '../../../src/lib/compile/simplify'

describe('simplifyDP', () => {
  it('collapses straight line to 2 points', () => {
    const line = Array.from({ length: 101 }, (_, i) => ({ x: i * 10, y: 0 }))
    expect(simplifyDP(line, 1)).toHaveLength(2)
  })
  it('keeps corners', () => {
    const corner = [{ x: 0, y: 0 }, { x: 50, y: 0 }, { x: 50, y: 50 }, { x: 0, y: 50 }, { x: 0, y: 0 }]
    expect(simplifyDP(corner, 1)).toHaveLength(5)
  })
  it('tighter tolerance keeps more points', () => {
    const zig = Array.from({ length: 50 }, (_, i) => ({ x: i * 10, y: i % 2 ? 3 : 0 }))
    expect(simplifyDP(zig, 1).length).toBeGreaterThanOrEqual(simplifyDP(zig, 10).length)
  })
  it('returns input for trivial input', () => {
    const one = [{ x: 1, y: 2 }]
    expect(simplifyDP(one, 1)).toHaveLength(1)
    expect(simplifyDP([], 1)).toHaveLength(0)
  })
  it('preserves endpoints', () => {
    const line = [{ x: 0, y: 0 }, { x: 5, y: 1 }, { x: 10, y: 0 }]
    const out = simplifyDP(line, 1)
    expect(out[0]).toEqual(line[0])
    expect(out[out.length - 1]).toEqual(line[line.length - 1])
  })
})
