import QRCode from 'qrcode'
import type { ShareWork } from './shareLink'

const FONT_URL = `${import.meta.env.BASE_URL}assets/fonts/ink-glyphs.ttf`
let fontReady: Promise<void> | null = null

/** canvas 文字必须先把 OFL 字体注册进 FontFace，否则掉回系统默认字体 */
async function ensureFont(): Promise<void> {
  if (document.fonts?.check('72px "InkGlyphs"')) return
  if (!fontReady) {
    fontReady = (async () => {
      const face = new FontFace('InkGlyphs', `url(${FONT_URL})`)
      await face.load()
      document.fonts.add(face)
    })().catch(() => {
      fontReady = null
    })
  }
  await fontReady
}

const PAPER = '#F5EFE3'
const INK = '#1F1B16'
const GOLD = '#C9A227'
const CINNABAR = '#A83A2A'

export interface PosterOpts {
  work: ShareWork
  distanceKm: string
  story?: string
}

/** 1080×1350 分享海报：宣纸 + 金线 + 落款 + QR。 */
export async function renderPoster(opts: PosterOpts): Promise<Blob> {
  await ensureFont()

  const W = 1080
  const H = 1350
  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')!

  ctx.fillStyle = PAPER
  ctx.fillRect(0, 0, W, H)

  // 金线路线（锚点归一化到海报中部）
  const anchors = opts.work.anchors
  if (anchors.length > 1) {
    const xs = anchors.map((a) => a[0])
    const ys = anchors.map((a) => a[1])
    const minX = Math.min(...xs)
    const maxX = Math.max(...xs)
    const minY = Math.min(...ys)
    const maxY = Math.max(...ys)
    const pad = 120
    const boxW = W - pad * 2
    const boxH = 760
    const k = Math.min(boxW / Math.max(1e-9, maxX - minX), boxH / Math.max(1e-9, maxY - minY))
    const offX = pad + (boxW - (maxX - minX) * k) / 2
    const offY = 220 + (boxH - (maxY - minY) * k) / 2
    ctx.strokeStyle = GOLD
    ctx.lineWidth = 14
    ctx.lineJoin = 'round'
    ctx.lineCap = 'round'
    ctx.globalAlpha = 0.22
    ctx.beginPath()
    anchors.forEach((a, i) => {
      const x = offX + (a[0] - minX) * k
      const y = offY + (maxY - a[1]) * k
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
    })
    ctx.stroke()
    ctx.globalAlpha = 1
    ctx.lineWidth = 5
    ctx.beginPath()
    anchors.forEach((a, i) => {
      const x = offX + (a[0] - minX) * k
      const y = offY + (maxY - a[1]) * k
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
    })
    ctx.stroke()
  }

  // 标题与文字
  ctx.fillStyle = INK
  ctx.textAlign = 'center'
  ctx.font = '700 96px "InkGlyphs", serif'
  ctx.fillText(opts.work.text, W / 2, 1060)
  ctx.font = '40px "InkGlyphs", serif'
  ctx.fillText(`${opts.work.cityId} · ${opts.distanceKm} km`, W / 2, 1130)
  ctx.font = '30px "InkGlyphs", serif'
  ctx.fillStyle = CINNABAR
  ctx.fillText(opts.story ?? '一笔画城 · 用脚步写一座城', W / 2, 1190)
  ctx.fillStyle = INK
  ctx.font = '28px "InkGlyphs", serif'
  ctx.fillText('刘辉 书于' + opts.work.cityId, W - 220, 1250)

  // QR（指向 demo）
  const qr = await QRCode.toDataURL(location.origin + location.pathname, { margin: 1, width: 160 })
  const img = new Image()
  await new Promise((r) => {
    img.onload = r
    img.src = qr
  })
  ctx.drawImage(img, 60, H - 220, 160, 160)

  return new Promise((resolve) => canvas.toBlob((b) => resolve(b!), 'image/png'))
}
