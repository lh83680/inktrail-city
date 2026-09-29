import { useEffect, useRef, useState } from 'react'

const SRC = `${import.meta.env.BASE_URL}media/inktrail-film-60s.mp4`
const POSTER = `${import.meta.env.BASE_URL}media/film-poster.jpg`

/** 参赛主视频入口：侧栏常驻，点开才拉流（避免 13MB 媒体进首屏）。 */
export function FilmVideo() {
  const [open, setOpen] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const backRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open) return
    backRef.current?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open])

  const close = () => {
    const v = videoRef.current
    if (v && !v.paused) v.pause()
    setOpen(false)
  }

  return (
    <section className="panel">
      <h2 className="panel-title">参赛主视频</h2>
      <p className="hint">60 秒：墨滴落纸，金色灯火沿北京街道一路点亮，写成一个「福」。</p>
      <div className="btn-row">
        <button type="button" className="btn btn-primary" onClick={() => setOpen(true)}>
          播放影片
        </button>
      </div>
      <div className="btn-row">
        {/* 静态视频在本平台被发成 octet-stream，Safari 拒播；下载是通用兜底通道 */}
        <a className="btn" href={SRC} download="一笔画城-主视频-60s.mp4">
          下载影片
        </a>
      </div>
      {open && (
        <div className="film-mask" role="presentation" onClick={close}>
          <div
            className="film-dialog"
            role="dialog"
            aria-modal="true"
            aria-label="一笔画城 参赛主视频"
            onClick={(e) => e.stopPropagation()}
          >
            <button ref={backRef} type="button" className="film-close" onClick={close} aria-label="关闭视频">
              ×
            </button>
            <video
              ref={videoRef}
              className="film-player"
              src={SRC}
              poster={POSTER}
              controls
              playsInline
              preload="none"
              autoPlay
            />
          </div>
        </div>
      )}
    </section>
  )
}
