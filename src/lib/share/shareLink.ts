import { deflate, inflate } from 'pako'
import type { LngLat } from '../geo/point'

export interface ShareWork {
  cityId: string
  text: string
  /** 墨坐标锚点（保留 ~6 位精度） */
  anchors: number[][]
  mode: string
}

function b64urlEncode(bytes: Uint8Array): string {
  let s = ''
  bytes.forEach((b) => (s += String.fromCharCode(b)))
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function b64urlDecode(s: string): Uint8Array {
  const padded = s.replace(/-/g, '+').replace(/_/g, '/')
  const bin = atob(padded)
  const out = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i)
  return out
}

export function encodeShareLink(work: ShareWork): string {
  const json = JSON.stringify(work)
  const bytes = new TextEncoder().encode(json)
  const deflated = deflate(bytes, { level: 9 })
  return b64urlEncode(deflated)
}

export function decodeShareLink(q: string): ShareWork {
  const bytes = b64urlDecode(q)
  const json = new TextDecoder().decode(inflate(bytes))
  return JSON.parse(json) as ShareWork
}

export function shareUrl(work: ShareWork, base = location.origin + location.pathname): string {
  return `${base}?work=${encodeShareLink(work)}`
}

/** 从路线抽稀出可分享的锚点（≤40 点，6 位精度）。 */
export function workFromRoute(cityId: string, text: string, path: LngLat[], mode = 'walk'): ShareWork {
  const step = Math.max(1, Math.ceil(path.length / 40))
  const anchors: number[][] = []
  for (let i = 0; i < path.length; i += step) {
    anchors.push([+path[i].lng.toFixed(6), +path[i].lat.toFixed(6)])
  }
  return { cityId, text, anchors, mode }
}
