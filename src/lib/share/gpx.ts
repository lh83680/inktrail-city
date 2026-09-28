import type { CompiledRoute } from '../compile/types'

/** 导出 GPX 1.1（导入运动手表/Strava）。 */
export function toGPX(route: CompiledRoute, name: string): string {
  const pts = route.path.length > 0 ? route.path : route.segments.flatMap((s) => s.path)
  const trkpts = pts
    .map((p) => `      <trkpt lat="${p.lat.toFixed(6)}" lon="${p.lng.toFixed(6)}"></trkpt>`)
    .join('\n')
  return `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="一笔画城" xmlns="http://www.topografix.com/GPX/1/1">
  <metadata>
    <name>${escapeXml(name)}</name>
    <desc>一笔画城 · 用脚步写一座城</desc>
  </metadata>
  <trk>
    <name>${escapeXml(name)}</name>
    <trkseg>
${trkpts}
    </trkseg>
  </trk>
</gpx>`
}

function escapeXml(s: string): string {
  return s.replace(/[<>&'"]/g, (c) => `&#${c.charCodeAt(0)};`)
}
