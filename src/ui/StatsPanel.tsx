import { useState } from 'react'
import { navDeepLink } from '../lib/share/deeplink'
import { toGPX } from '../lib/share/gpx'
import { workFromRoute, shareUrl } from '../lib/share/shareLink'
import { renderPoster } from '../lib/share/poster'
import type { useWorkStore } from '../state/store'

type Store = ReturnType<typeof useWorkStore>

function download(filename: string, content: string | Blob, mime = 'text/plain') {
  const blob = content instanceof Blob ? content : new Blob([content], { type: mime })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = filename
  a.click()
  setTimeout(() => URL.revokeObjectURL(a.href), 5000)
}

export function StatsPanel({ store }: { store: Store }) {
  const { route, status, error } = store
  const [busy, setBusy] = useState(false)
  const story = route?.pois.slice(0, 6) ?? []

  const onNav = () => {
    if (!route || route.path.length < 2) return
    window.open(navDeepLink(route.path[0], route.path[route.path.length - 1], 'walk'), '_blank')
  }

  const onGpx = () => {
    if (!route) return
    download(`一笔画城-${store.text || '福'}.gpx`, toGPX(route, store.text || '福'), 'application/gpx+xml')
  }

  const onPoster = async () => {
    if (!route) return
    setBusy(true)
    try {
      const work = workFromRoute('北京', store.text || '福', route.path)
      const blob = await renderPoster({ work, distanceKm: (route.distanceM / 1000).toFixed(2) })
      download(`一笔画城-${store.text || '福'}.png`, blob)
    } finally {
      setBusy(false)
    }
  }

  const onShare = async () => {
    if (!route) return
    const work = workFromRoute('北京', store.text || '福', route.path)
    const url = shareUrl(work)
    await navigator.clipboard?.writeText(url).catch(() => {})
    alert('分享链接已复制')
  }

  return (
    <section className="panel">
      <h2 className="panel-title">这一笔</h2>
      {status === 'error' && <p className="err">{error}</p>}
      {status === 'compiling' && <p className="hint">正在贴路算路…</p>}
      {!route && status !== 'compiling' && <p className="hint">写个字，编译出路线。</p>}
      {route && (
        <>
          <dl className="stats">
            <div className="stat">
              <dt>保真度</dt>
              <dd className="stat-gold">{Math.round(route.fidelity * 100)}%</dd>
            </div>
            <div className="stat">
              <dt>距离</dt>
              <dd>{(route.distanceM / 1000).toFixed(2)} km</dd>
            </div>
            <div className="stat">
              <dt>步行约</dt>
              <dd>{route.walkMin} 分钟</dd>
            </div>
          </dl>
          {route.note.length > 0 && <p className="hint">提示：{route.note.join('；')}</p>}
          <div className="btn-row">
            <button type="button" className="btn btn-primary" onClick={onNav}>
              去走走（百度地图导航）
            </button>
          </div>
          <div className="btn-row">
            <button type="button" className="btn" onClick={onGpx} disabled={busy}>
              导出 GPX
            </button>
            <button type="button" className="btn" onClick={onPoster} disabled={busy}>
              生成海报
            </button>
            <button type="button" className="btn" onClick={onShare} disabled={busy}>
              复制分享
            </button>
          </div>
          {story.length > 0 && (
            <ul className="story-list">
              {story.map((s) => (
                <li key={s.title} className="story-card">
                  <span className="story-dot" />
                  {s.title}
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </section>
  )
}
