import { useCallback, useRef, useState } from 'react'
import { compileWork } from '../lib/compile/pipeline'
import { createBaiduAdapter } from '../map/baiduAdapter'
import { createMapStage, type PaperStyle } from '../map/mapStage'
import { loadGlyphFont, type GlyphFont } from '../lib/glyph/glyphPath'
import type { CharBox } from '../lib/compile/layout'
import snapshotData from '../data/snapshots.json'
import type { AnchorSet, CompiledRoute, Stroke, TravelMode } from '../lib/compile/types'

export type WorkStatus = 'idle' | 'compiling' | 'done' | 'error'

export const BEIJING = { lng: 116.404, lat: 39.915 }
export type Center = typeof BEIJING

const PAPER_STYLE: PaperStyle = {
  styleJson: [
    { featureType: 'all', elementType: 'geometry', stylers: { color: '#F5EFE3' } },
    { featureType: 'water', elementType: 'all', stylers: { color: '#E9E2CF' } },
    { featureType: 'road', elementType: 'geometry', stylers: { color: '#DCD3BC', weight: '0.5' } },
    { featureType: 'green', elementType: 'geometry', stylers: { color: '#E6E0CB' } },
    { featureType: 'building', elementType: 'geometry', stylers: { color: '#EFE8D6' } },
    { featureType: 'poilabel', elementType: 'labels', stylers: { visibility: 'off' } },
  ],
}

const M_PER_PX = 14

export function useWorkStore() {
  const [city, setCity] = useState('北京')
  const [center, setCenter] = useState<Center>(BEIJING)
  const [text, setText] = useState('')
  const [strokes, setStrokes] = useState<Stroke[]>([])
  const [status, setStatus] = useState<WorkStatus>('idle')
  const [error, setError] = useState('')
  const [route, setRoute] = useState<CompiledRoute | null>(null)
  const stageRef = useRef<ReturnType<typeof createMapStage> | null>(null)
  const glyphRef = useRef<GlyphFont | null>(null)

  const attachMap = useCallback((container: HTMLElement) => {
    stageRef.current = createMapStage(container, {
      ak: 'inline',
      style: PAPER_STYLE,
      center,
      zoom: 11,
    })
    return stageRef.current
  }, [])

  const compile = useCallback(
    async (mode: TravelMode = 'walk') => {
      const stage = stageRef.current
      if (!stage || text.length === 0) {
        setError('先写一个字')
        setStatus('error')
        return
      }
      setStatus('compiling')
      setError('')
      try {
        if (!glyphRef.current) {
          try {
            glyphRef.current = await loadGlyphFont(`${import.meta.env.BASE_URL}assets/fonts/ink-glyphs.ttf`)
          } catch {
            glyphRef.current = null
          }
        }
        const font = glyphRef.current
        const stage = stageRef.current
        const adapter = createBaiduAdapter((window as any).BMapGL, stage?.map)
        const compiled = await compileWork({
          text,
          strokes: strokes.slice(0, 1),
          adapter,
          params: { density: 'dense', mode },
          center,
          metersPerPx: M_PER_PX,
          glyphProvider: font
            ? (char: string, _index: number, box: CharBox): AnchorSet => {
                const cx = box.x + box.w / 2
                const cy = box.y + box.h / 2
                const k = Math.cos((center.lat * Math.PI) / 180)
                return {
                  strokes: font.path(char, box.w).map((s) =>
                    s.map((p) => ({
                      lng: center.lng + ((p.x - cx) * M_PER_PX) / (111320 * k),
                      lat: center.lat + ((p.y - cy) * M_PER_PX) / 111320,
                    })),
                  ),
                }
              }
            : undefined,
        })
        setRoute(compiled)
        setStatus('done')
        stage?.render(compiled, { litSegment: compiled.segments.length, mode, idealStrokes: compiled.idealStrokes })
        stage?.fit(compiled.path)
      } catch (e) {
        // 配额耗尽/网络异常：展示同字预编译快照（诚实标注为样板）
        const snap = snapshotData.char === text ? (snapshotData.route as unknown as CompiledRoute) : null
        if (snap) {
          setRoute(snap)
          setStatus('done')
          setError('')
          stage?.render(snap, { litSegment: snap.segments.length, mode, idealStrokes: snap.idealStrokes })
          stage?.fit(snap.path)
          setError('当前离线配额已满或网络异常，展示的是预编译样板路线')
        } else {
          setError(e instanceof Error ? e.message : '编译失败')
          setStatus('error')
        }
      }
    },
    [text, strokes],
  )

  const getStage = useCallback(() => stageRef.current, [])

  return {
    city,
    setCity,
    center,
    setCenter,
    text,
    setText,
    strokes,
    setStrokes,
    status,
    error,
    setError,
    route,
    attachMap,
    getStage,
    compile,
  }
}
