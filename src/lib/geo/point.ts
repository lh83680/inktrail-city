export interface Pt { x: number; y: number }
export interface LngLat { lng: number; lat: number }

const EARTH_R = 6371008.8
const D2R = Math.PI / 180

export function toMeters(p: LngLat, ref: LngLat): Pt {
  const x = (p.lng - ref.lng) * D2R * EARTH_R * Math.cos(ref.lat * D2R)
  const y = (p.lat - ref.lat) * D2R * EARTH_R
  return { x, y }
}

export function pathLengthM(path: LngLat[]): number {
  if (path.length < 2) return 0
  const ref = path[0]
  let total = 0
  for (let i = 1; i < path.length; i++) {
    const a = toMeters(path[i - 1], ref)
    const b = toMeters(path[i], ref)
    total += Math.hypot(b.x - a.x, b.y - a.y)
  }
  return total
}
