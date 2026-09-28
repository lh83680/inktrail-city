import type { LngLat } from '../../geo/point'
import type { TravelMode } from '../types'

export interface GeoPoint {
  road?: string
  poi?: string
  /** 最近可通行道路点（贴路目标） */
  point?: LngLat
}

export interface PoiHit {
  title: string
  point: LngLat
}

export interface MapAdapter {
  route(from: LngLat, to: LngLat, mode: TravelMode): Promise<LngLat[]>
  reverseGeocode(p: LngLat): Promise<GeoPoint>
  searchNearby(keyword: string, center: LngLat, radiusM: number): Promise<PoiHit[]>
}
