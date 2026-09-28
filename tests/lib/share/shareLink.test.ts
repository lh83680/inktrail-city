import { encodeShareLink, decodeShareLink, workFromRoute, shareUrl } from '../../../src/lib/share/shareLink'

describe('shareLink', () => {
  it('roundtrips share link', () => {
    const w = { cityId: '北京', text: '福', anchors: [[116.4, 39.9]], mode: 'walk' }
    const q = encodeShareLink(w)
    expect(q.length).toBeLessThan(2048)
    expect(decodeShareLink(q).text).toBe('福')
    expect(decodeShareLink(q).anchors).toEqual([[116.4, 39.9]])
  })
  it('workFromRoute thins paths to 40 points', () => {
    const path = Array.from({ length: 200 }, (_, i) => ({ lng: 116.4 + i * 0.0001, lat: 39.9 }))
    const w = workFromRoute('北京', '福', path)
    expect(w.anchors.length).toBeLessThanOrEqual(40)
    expect(w.anchors[0][0]).toBeCloseTo(116.4, 6)
  })
  it('shareUrl contains work param', () => {
    const u = shareUrl({ cityId: '北京', text: '福', anchors: [[116.4, 39.9]], mode: 'walk' }, 'https://x.app/')
    expect(u).toMatch(/^https:\/\/x\.app\/\?work=/)
    const q = u.split('?work=')[1]
    expect(decodeShareLink(q).text).toBe('福')
  })
})
