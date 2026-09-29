import { useEffect, useRef, useState } from 'react'

const VOTE_URL = 'https://lbs.baidu.com/developer/hackathon?s=o1#work-104'
const QR = `${import.meta.env.BASE_URL}media/vote-qr.png`

/** 公众投票入口：截止 2026-09-30，每人每天 1 票，见大赛页投票规则。 */
export function VoteBar() {
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const closeRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open) return
    closeRef.current?.focus()
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open])

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(VOTE_URL)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      window.prompt('复制投票链接：', VOTE_URL)
    }
  }

  return (
    <>
      <div className="vote-bar">
        <span className="vote-bar-text">
          一笔画城 参赛百度地图开发者创作大赛 · 公众投票 <b>9.30 截止</b>（每人每天 1 票）
        </span>
        <a className="vote-bar-btn" href={VOTE_URL} target="_blank" rel="noreferrer">
          去投票
        </a>
        <button type="button" className="vote-bar-btn vote-bar-btn-ghost" onClick={() => setOpen(true)}>
          扫码投票
        </button>
      </div>
      {open && (
        <div className="vote-mask" role="presentation" onClick={() => setOpen(false)}>
          <div
            className="vote-dialog"
            role="dialog"
            aria-modal="true"
            aria-label="扫码为一笔画城投票"
            onClick={(e) => e.stopPropagation()}
          >
            <button ref={closeRef} type="button" className="film-close" onClick={() => setOpen(false)} aria-label="关闭">
              ×
            </button>
            <h3 className="vote-title">为一笔画城投票</h3>
            <img className="vote-qr" src={QR} alt="一笔画城投票二维码" width={220} height={220} />
            <p className="vote-hint">微信扫一扫，或复制链接发给好友 / 朋友圈</p>
            <div className="vote-url">{VOTE_URL}</div>
            <div className="btn-row" style={{ justifyContent: 'center' }}>
              <button type="button" className="btn btn-primary" onClick={copy}>
                {copied ? '已复制' : '复制链接'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
