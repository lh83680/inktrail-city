import { useEffect, useRef } from 'react'
import type { useWorkStore } from '../state/store'

type Store = ReturnType<typeof useWorkStore>

/** 起点街景：BMapGL.Panorama 挂在路线起点 */
export function StreetView({ store }: { store: Store }) {
  const holder = useRef<HTMLDivElement>(null)
  const panoRef = useRef<any>(null)

  useEffect(() => {
    const gl = (window as any).BMapGL
    const start = store.route?.path[0]
    if (!gl || !start || !holder.current) return
    try {
      if (!panoRef.current) panoRef.current = new gl.Panorama(holder.current)
      panoRef.current.setPosition(new gl.Point(start.lng, start.lat))
    } catch {
      /* 全景不可用时静默隐藏 */
    }
  }, [store.route])

  if (!store.route) return null
  return (
    <section className="panel">
      <h2 className="panel-title">起点街景</h2>
      <div ref={holder} className="street-view" />
    </section>
  )
}
