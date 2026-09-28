import { snapAnchors } from '../../../src/lib/compile/snap'

// 注意：fake 的 reverseGeocode 返回锚点附近（<=40m）的稳定"道路点"，保证 snapM <=40 且顺序稳定。
import { createFakeAdapter } from '../../../src/lib/compile/adapters/fakeAdapter'

describe('snapAnchors', () => {
  it('snaps each anchor and reports snap distance', async () => {
    const fake = createFakeAdapter()
    const out = await snapAnchors([{ lng: 116.4, lat: 39.91 }, { lng: 116.41, lat: 39.92 }], fake)
    expect(out).toHaveLength(2)
    out.forEach((o) => expect(o.snapM).toBeLessThanOrEqual(40))
  })
  it('preserves order', async () => {
    const fake = createFakeAdapter()
    const out = await snapAnchors(
      [
        { lng: 116.4, lat: 39.91 },
        { lng: 116.41, lat: 39.92 },
        { lng: 116.42, lat: 39.93 },
      ],
      fake,
    )
    const xs = out.map((o) => o.anchor.lng)
    expect([...xs].sort((a, b) => a - b)).toEqual(xs)
  })
  it('falls back to original anchor when snap fails', async () => {
    const fake = createFakeAdapter({ failReverse: true })
    const input = [{ lng: 116.4, lat: 39.91 }]
    const out = await snapAnchors(input, fake)
    expect(out[0].anchor).toEqual(input[0])
    expect(out[0].snapM).toBe(Infinity)
  })
})
