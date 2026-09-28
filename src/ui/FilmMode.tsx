import { useEffect, useRef, useState } from 'react'
import { loadGlyphFont } from '../lib/glyph/glyphPath'
import { drawTaperedStroke } from '../lib/ink/render'
import { compileWork } from '../lib/compile/pipeline'
import { createBaiduAdapter } from '../map/baiduAdapter'
import snapshotData from '../data/snapshots.json'
import { BEIJING, type useWorkStore } from '../state/store'
import type { CharBox } from '../lib/compile/layout'
import type { AnchorSet, CompiledRoute } from '../lib/compile/types'

type Store = ReturnType<typeof useWorkStore>

const INK = '#1F1B16'
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

/** 首屏电影模式：墨滴落纸→笔锋游走→金线段序点亮→数据面板→CTA。 */
export function FilmMode({ store, onDone }: { store: Store; onDone: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [phase, setPhase] = useState<'ink' | 'route' | 'ready'>('ink')
  const [stats, setStats] = useState<{ fidelity: number; km: number; min: number } | null>(null)
  const [demo, setDemo] = useState(false)

  useEffect(() => {
    let cancelled = false
    const run = async () => {
      await sleep(800)
      let stage = store.getStage()
      for (let i = 0; i < 60 && !stage && !cancelled; i++) {
        await sleep(1000)
        stage = store.getStage()
      }
      if (!stage || cancelled) return
      const font = await loadGlyphFont(`${import.meta.env.BASE_URL}assets/fonts/ink-glyphs.ttf`).catch(() => null)
      // 墨稿：福 逐笔书写
      const canvas = canvasRef.current
      if (canvas && font) {
        const ctx = canvas.getContext('2d')!
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        const strokes = font.path('福', canvas.width * 0.6)
        const ox = canvas.width * 0.2
        const oy = canvas.height * 0.2
        for (const s of strokes) {
          if (cancelled) return
          const pts = s.map((p) => ({ ...p, x: p.x + ox, y: p.y + oy, pressure: 0.7, velocity: 200 }))
          for (let i = 2; i <= pts.length; i += 2) {
            drawTaperedStroke(ctx, pts.slice(0, i), INK)
            await sleep(30)
          }
          drawTaperedStroke(ctx, pts, INK)
        }
      }
      await sleep(600)
      if (cancelled) return

      // 路线：真实编译优先，失败/无 AK 走预编译快照（示意模式）
      setPhase('route')
      let route: CompiledRoute | null = null
      try {
        const stage = store.getStage()
        const adapter = createBaiduAdapter((window as any).BMapGL, stage?.map)
        route = await compileWork({
          text: '福',
          strokes: [],
          adapter,
          params: { density: 'dense', mode: 'walk' },
          center: BEIJING,
          metersPerPx: 14,
          glyphProvider: font
            ? (char: string, _i: number, box: CharBox): AnchorSet => {
                const cx = box.x + box.w / 2
                const cy = box.y + box.h / 2
                const k = Math.cos((BEIJING.lat * Math.PI) / 180)
                return {
                  strokes: font.path(char, box.w).map((s) =>
                    s.map((p) => ({
                      lng: BEIJING.lng + ((p.x - cx) * 14) / (111320 * k),
                      lat: BEIJING.lat + ((p.y - cy) * 14) / 111320,
                    })),
                  ),
                }
              }
            : undefined,
        })
        if (route.note.length > 0 && route.segments.every((s) => s.kind === 'fallback')) route = null
      } catch {
        route = null
      }
      if (cancelled) return
      if (!route) {
        route = snapshotData.route as unknown as CompiledRoute
        setDemo(true)
      }

      // 点亮：固定 ~20 批、总时长 ~6 秒（不随段数爆炸）
      const BATCHES = 20
      const batch = Math.max(1, Math.ceil(route.segments.length / BATCHES))
      for (let i = batch; i <= route.segments.length; i += batch) {
        if (cancelled) return
        stage.render(route, { litSegment: i, mode: 'walk', idealStrokes: route.idealStrokes })
        await sleep(6000 / BATCHES)
      }
      if (route.segments.length % batch !== 0) {
        stage.render(route, { litSegment: route.segments.length, mode: 'walk', idealStrokes: route.idealStrokes })
      }
      stage.fit(route.path)
      setStats({
        fidelity: Math.round(route.fidelity * 100),
        km: route.distanceM / 1000,
        min: route.walkMin,
      })
      setPhase('ready')
    }
    run()
    return () => {
      cancelled = true
    }
  }, [store])

  return (
    <div className="film">
      <canvas ref={canvasRef} className="film-ink" width={600} height={360} />
      <div className="film-stats">
        {phase === 'ready' && stats && (
          <>
            <span className="film-num gold">{stats.fidelity}%</span> 保真度 ·{' '}
            <span className="film-num">{stats.km.toFixed(2)} km</span> · 步行{' '}
            <span className="film-num">{stats.min}</span> 分钟
            {demo && <em className="film-demo">（示意数据 · 首次真实编译需联网）</em>}
          </>
        )}
        {phase !== 'ready' && <span className="film-running">{phase === 'ink' ? '落墨成字…' : '点亮路线…'}</span>}
      </div>
      {phase === 'ready' && (
        <div className="film-cta">
          <button type="button" className="btn btn-primary" onClick={onDone}>
            这一次，写你自己的字
          </button>
        </div>
      )}
    </div>
  )
}
