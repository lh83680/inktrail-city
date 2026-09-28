import { useEffect, useRef, useState } from 'react'
import { useWorkStore } from './state/store'
import { loadBMapGL } from './map/loadBMapGL'
import { DrawPanel } from './ui/DrawPanel'
import { StatsPanel } from './ui/StatsPanel'
import { FilmMode } from './ui/FilmMode'
import { CityPicker } from './ui/CityPicker'
import { StreetView } from './ui/StreetView'

export default function App() {
  const store = useWorkStore()
  const holder = useRef<HTMLDivElement>(null)
  const inited = useRef(false)
  const [filmDone, setFilmDone] = useState(false)

  useEffect(() => {
    if (inited.current || !holder.current) return
    inited.current = true
    loadBMapGL()
      .then(() => store.attachMap(holder.current!))
      .catch((e) => {
        store.setError(e instanceof Error ? e.message : '地图初始化失败')
        console.error('[inktrail] map init failed:', e)
      })
  }, [store])

  return (
    <div className="app">
      <header className="app-head">
        <h1 className="app-title">一笔画城</h1>
        <p className="app-tagline">把你想写的字，写进任何一座城市</p>
      </header>
      <main className="app-main">
        <div className="map-stage-wrap">
          <div className="map-holder" ref={holder} />
          {!filmDone && <FilmMode store={store} onDone={() => setFilmDone(true)} />}
        </div>
        <aside className="side">
          {filmDone ? (
            <>
              <CityPicker store={store} />
              <DrawPanel store={store} />
              <StatsPanel store={store} />
              <StreetView store={store} />
            </>
          ) : (
            <section className="panel">
              <h2 className="panel-title">写图是涂鸦，写字是编译</h2>
              <p className="hint">
                一笔画城把手写的汉字编译成沿城市真实道路的步行 / 骑行路线：字形锚点化、贴路吸附、分段算路，实时度量保真度。
              </p>
            </section>
          )}
        </aside>
      </main>
    </div>
  )
}
