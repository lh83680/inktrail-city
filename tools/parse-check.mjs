// 验证 ink-glyphs.ttf 可被 opentype.js 解析且关键字符有轮廓。
// 用法: node tools/parse-check.mjs
import opentype from 'opentype.js'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const here = dirname(fileURLToPath(import.meta.url))
const fontPath = join(here, '..', 'src', 'assets', 'fonts', 'ink-glyphs.ttf')
const buffer = readFileSync(fontPath).buffer
const font = opentype.parse(buffer)

const targets = ['福', '龍', '愛', '♥', '∞']
let failed = false
for (const ch of targets) {
  const glyph = font.charToGlyph(ch)
  const path = glyph.getPath(0, 0, 100)
  const ok = path.commands.length > 5
  console.log(`${ch}: commands=${path.commands.length} ${ok ? 'OK' : 'FAIL'}`)
  if (!ok) failed = true
}
process.exit(failed ? 1 : 0)
