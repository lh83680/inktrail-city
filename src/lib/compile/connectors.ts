import type { LngLat } from '../geo/point'
import type { AnchorSet } from './types'

export interface ConnectorPair {
  /** 第 i 个字与第 i+1 个字之间 */
  i: number
  from: LngLat
  to: LngLat
}

/** 字间连接段：第 i 字末笔终点 → 第 i+1 字首笔起点。 */
export function connectorPairs(anchorSets: AnchorSet[]): ConnectorPair[] {
  const pairs: ConnectorPair[] = []
  for (let i = 0; i < anchorSets.length - 1; i++) {
    const a = anchorSets[i]
    const b = anchorSets[i + 1]
    const lastStroke = a.strokes[a.strokes.length - 1]
    const firstStroke = b.strokes[0]
    if (!lastStroke?.length || !firstStroke?.length) continue
    pairs.push({ i, from: lastStroke[lastStroke.length - 1], to: firstStroke[0] })
  }
  return pairs
}
