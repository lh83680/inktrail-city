import opentype from 'opentype.js'
import type { Pt } from '../geo/point'

export interface GlyphFont {
  /** 取字符轮廓 → 按笔画序的折线数组（坐标 0..scale） */
  path(char: string, scale: number): Pt[][]
}

const FONT_PATH = 'public/assets/fonts/ink-glyphs.ttf'

interface PathCommand {
  type: 'M' | 'L' | 'Q' | 'C' | 'Z'
  x: number
  y: number
  x1?: number
  y1?: number
  x2?: number
  y2?: number
}

/** 从命令流按 M 起点切分为多条笔画折线，Q/C 采样 8 等分。 */
function commandsToStrokes(commands: PathCommand[]): Pt[][] {
  const strokes: Pt[][] = []
  let cur: Pt[] = []
  let cx = 0
  let cy = 0
  const push = (x: number, y: number) => cur.push({ x, y })
  for (const cmd of commands) {
    if (cmd.type === 'M') {
      if (cur.length > 1) strokes.push(cur)
      cur = []
      cx = cmd.x
      cy = cmd.y
      push(cx, cy)
    } else if (cmd.type === 'L') {
      push(cmd.x, cmd.y)
      cx = cmd.x
      cy = cmd.y
    } else if (cmd.type === 'Q') {
      const { x1: qx1 = cx, y1: qy1 = cy } = cmd
      for (let i = 1; i <= 8; i++) {
        const t = i / 8
        const x = (1 - t) * (1 - t) * cx + 2 * (1 - t) * t * qx1 + t * t * cmd.x
        const y = (1 - t) * (1 - t) * cy + 2 * (1 - t) * t * qy1 + t * t * cmd.y
        push(x, y)
      }
      cx = cmd.x
      cy = cmd.y
    } else if (cmd.type === 'C') {
      const { x1: c1x = cx, y1: c1y = cy, x2: c2x = cmd.x, y2: c2y = cmd.y } = cmd
      for (let i = 1; i <= 8; i++) {
        const t = i / 8
        const x =
          (1 - t) ** 3 * cx + 3 * (1 - t) ** 2 * t * c1x + 3 * (1 - t) * t * t * c2x + t ** 3 * cmd.x
        const y =
          (1 - t) ** 3 * cy + 3 * (1 - t) ** 2 * t * c1y + 3 * (1 - t) * t * t * c2y + t ** 3 * cmd.y
        push(x, y)
      }
      cx = cmd.x
      cy = cmd.y
    } else if (cmd.type === 'Z') {
      if (cur.length > 1) strokes.push(cur)
      cur = []
    }
  }
  if (cur.length > 1) strokes.push(cur)
  return strokes
}

/** 归一化笔画组到 0..scale 方盒（等比缩放 + 居中）。 */
function normalize(strokes: Pt[][], scale: number): Pt[][] {
  const all = strokes.flat()
  const minX = Math.min(...all.map((p) => p.x))
  const minY = Math.min(...all.map((p) => p.y))
  const w = Math.max(...all.map((p) => p.x)) - minX || 1
  const h = Math.max(...all.map((p) => p.y)) - minY || 1
  const k = scale / Math.max(w, h)
  const offX = (scale - w * k) / 2
  const offY = (scale - h * k) / 2
  return strokes.map((s) => s.map((p) => ({ x: (p.x - minX) * k + offX, y: (p.y - minY) * k + offY })))
}

/** 浏览器传 URL；Node 测试直接给相对文件路径。 */
export async function loadGlyphFont(url: string = FONT_PATH): Promise<GlyphFont> {
  let buffer: ArrayBuffer
  if (typeof window === 'undefined') {
    const { readFileSync } = await import('node:fs')
    buffer = readFileSync(url).buffer as ArrayBuffer
  } else {
    buffer = await (await fetch(url)).arrayBuffer()
  }
  const font = opentype.parse(buffer)
  return {
    path(char: string, scale: number): Pt[][] {
      const glyph = font.charToGlyph(char)
      if (!glyph.unicode || glyph.index === 0) {
        throw new Error(`glyph-missing:${char}`)
      }
      const path = glyph.getPath(0, 0, scale)
      const strokes = commandsToStrokes(path.commands as PathCommand[])
      return normalize(strokes, scale)
    },
  }
}
