import { useCallback, useRef, useState } from 'react'
import type { RefObject } from 'react'
import type { Stroke, StrokePoint } from '../compile/types'

const PRESSURE_FALLBACK = 0.5

/** PointerEvent 手写采集：输出 Stroke[]（含压感/速度），支持撤销与清空。 */
export function useStrokeCapture(canvasRef: RefObject<HTMLCanvasElement | null>) {
  const [strokes, setStrokes] = useState<Stroke[]>([])
  const current = useRef<StrokePoint[]>([])
  const lastT = useRef(0)
  const lastPos = useRef({ x: 0, y: 0 })

  const posOf = useCallback((e: PointerEvent) => {
    const el = canvasRef.current
    if (!el) return { x: 0, y: 0 }
    const r = el.getBoundingClientRect()
    return { x: e.clientX - r.left, y: e.clientY - r.top }
  }, [canvasRef])

  const onPointerDown = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      e.currentTarget.setPointerCapture(e.pointerId)
      const { x, y } = posOf(e.nativeEvent)
      lastT.current = e.timeStamp
      lastPos.current = { x, y }
      current.current = [
        { x, y, pressure: e.pressure > 0 ? e.pressure : PRESSURE_FALLBACK, velocity: 0, t: e.timeStamp },
      ]
    },
    [posOf],
  )

  const onPointerMove = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      if (current.current.length === 0) return
      const { x, y } = posOf(e.nativeEvent)
      const dt = Math.max(1, e.timeStamp - lastT.current)
      const v = Math.hypot(x - lastPos.current.x, y - lastPos.current.y) / dt
      lastT.current = e.timeStamp
      lastPos.current = { x, y }
      current.current.push({
        x,
        y,
        pressure: e.pressure > 0 ? e.pressure : PRESSURE_FALLBACK,
        velocity: v,
        t: e.timeStamp,
      })
    },
    [posOf],
  )

  const onPointerUp = useCallback(() => {
    if (current.current.length > 0) {
      setStrokes((prev) => [...prev, { points: current.current }])
    }
    current.current = []
  }, [])

  const clear = useCallback(() => setStrokes([]), [])
  const undo = useCallback(() => setStrokes((prev) => prev.slice(0, -1)), [])

  return { strokes, setStrokes, clear, undo, handlers: { onPointerDown, onPointerMove, onPointerUp } }
}
