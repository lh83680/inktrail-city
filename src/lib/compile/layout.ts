export interface CharBox {
  x: number
  y: number
  w: number
  h: number
}

export interface LaidChar {
  char: string
  box: CharBox
}

export interface Viewport {
  width: number
  height: number
}

/** 多字排版：方格字身高宽一致，行内容量自适应，纵向居中。 */
export function layoutChars(text: string, viewport: Viewport): LaidChar[] {
  const chars = [...text]
  if (chars.length === 0) return []
  const size = Math.min(viewport.width, viewport.height) * 0.18
  const perRow = Math.max(1, Math.floor(viewport.width / (size * 1.15)))
  const rows = Math.ceil(chars.length / perRow)
  const rowH = viewport.height / rows
  return chars.map((char, i) => {
    const row = Math.floor(i / perRow)
    const col = i % perRow
    const colsInRow = Math.min(perRow, chars.length - row * perRow)
    const rowW = colsInRow * size * 1.15
    const x = (viewport.width - rowW) / 2 + col * size * 1.15
    const y = row * rowH + (rowH - size) / 2
    return { char, box: { x, y, w: size, h: size } }
  })
}
