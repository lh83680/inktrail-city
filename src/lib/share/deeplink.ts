import type { LngLat } from '../geo/point'
import type { TravelMode } from '../compile/types'

const MODE_MAP: Record<TravelMode, string> = {
  walk: 'walking',
  ride: 'riding',
  drive: 'driving',
}

/** 调起百度地图 App/网页导航（output=html → 无 App 时落网页）。 */
export function navDeepLink(origin: LngLat, dest: LngLat, mode: TravelMode): string {
  const params = new URLSearchParams({
    origin: `${origin.lat},${origin.lng}`,
    destination: `${dest.lat},${dest.lng}`,
    mode: MODE_MAP[mode],
    coord_type: 'bd09ll',
    output: 'html',
    src: 'inktrail.hackathon',
  })
  return `https://api.map.baidu.com/direction?${params.toString()}`
}
