import { GB2312_LEVEL1 } from './gb2312Level1'

const EXTRA = '福龍愛沪蓉穗粤镐渝杭苏蓉甯'
const SYMBOLS = '♥∞&0123456789ABCXYZ'
export function buildGlyphCharSet(): string[] {
  return [...new Set([...GB2312_LEVEL1, ...EXTRA, ...SYMBOLS])]
}
