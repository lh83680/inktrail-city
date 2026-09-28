import { it } from 'vitest'
import { writeFileSync, mkdirSync } from 'node:fs'
import { compileWork } from '../../src/lib/compile/pipeline'
import { createFakeAdapter } from '../../src/lib/compile/adapters/fakeAdapter'
import { loadGlyphFont } from '../../src/lib/glyph/glyphPath'

// 生成福@北京 的预编译快照（配额耗尽/断网时的演示兜底，Task 27 L3 防线数据源）
// 用真实字体 provider（与应用一致的形态），fake adapter 保证零网络可重跑
it('generates preset snapshot', async () => {
  const font = await loadGlyphFont('public/assets/fonts/ink-glyphs.ttf')
  const fake = createFakeAdapter({ snapOffsetM: 0 })
  const center = { lng: 116.404, lat: 39.915 }
  const route = await compileWork({
    text: '福',
    strokes: [],
    adapter: fake,
    params: { density: 'dense', mode: 'walk' },
    center,
    metersPerPx: 14,
    viewport: { width: 800, height: 600 },
    glyphProvider: (char, _index, box) => {
      const cx = box.x + box.w / 2
      const cy = box.y + box.h / 2
      const k = Math.cos((center.lat * Math.PI) / 180)
      return {
        strokes: font.path(char, box.w).map((s) =>
          s.map((p) => ({
            lng: center.lng + ((p.x - cx) * 14) / (111320 * k),
            lat: center.lat + ((p.y - cy) * 14) / 111320,
          })),
        ),
      }
    },
  })
  const out = { cityId: '北京', char: '福', route }
  mkdirSync('src/data', { recursive: true })
  writeFileSync('src/data/snapshots.json', JSON.stringify(out))
  console.log(
    'snapshot: segments=%d distance=%.0fm fidelity=%d idealStrokes=%d',
    route.segments.length,
    route.distanceM,
    route.fidelity,
    route.idealStrokes.length,
  )
})
