// @vitest-environment jsdom
import { createMapStage } from '../../src/map/mapStage'
import type { LngLat } from '../../src/lib/geo/point'
import type { CompiledRoute } from '../../src/lib/compile/types'

function makeRoute(n: number): CompiledRoute {
  const segments = Array.from({ length: n }, (_, i) => ({
    path: [
      { lng: 116.4 + i * 0.001, lat: 39.9 },
      { lng: 116.4 + (i + 1) * 0.001, lat: 39.9 },
    ] as LngLat[],
    from: { lng: 116.4 + i * 0.001, lat: 39.9 },
    to: { lng: 116.4 + (i + 1) * 0.001, lat: 39.9 },
    kind: 'stroke' as const,
  }))
  return {
    segments,
    path: segments.flatMap((s) => s.path),
    distanceM: 500,
    walkMin: 7,
    fidelity: 0.9,
    note: [],
    pois: [],
    idealStrokes: [],
  }
}

function createFakeGL() {
  const state = { polylines: [] as any[], markers: [] as any[], viewport: 0, style: null as any }
  const gl: any = {}
  gl.Point = class {
    constructor(public lng: number, public lat: number) {}
  }
  gl.Bounds = class {
    points: any[] = []
    extend(p: any) {
      this.points.push(p)
    }
  }
  gl.Polyline = class {
    opts: any
    constructor(path: any[], opts: any) {
      this.path = path
      this.opts = { ...opts }
      state.polylines.push(this)
    }
    setStrokeOpacity(o: number) {
      this.opts.strokeOpacity = o
    }
  }
  gl.Marker = class {
    constructor(point: any, _opts: any) {
      state.markers.push({ point })
    }
  }
  gl.Map = class {
    setMapStyleV2(style: any) {
      state.style = style
    }
    addOverlay(o: any) {
      void o
    }
    clearOverlays() {
      state.polylines.length = 0
      state.markers.length = 0
    }
    setViewport() {
      state.viewport++
    }
    centerAndZoom() {}
    enableScrollWheelZoom() {}
  }
  return { gl, state }
}

const paperStyle = { styleJson: [{ featureType: 'land', elementType: 'geometry', stylers: { color: '#F5EFE3' } }] }

describe('createMapStage', () => {
  it('renders glow + solid polylines per segment', () => {
    const { gl, state } = createFakeGL()
    const stage = createMapStage(document.createElement('div'), { ak: 'test', style: paperStyle, gl })
    stage.render(makeRoute(3), { litSegment: 3, mode: 'walk' })
    expect(state.polylines).toHaveLength(6)
    expect(stage.debugState().polylines).toHaveLength(6)
  })
  it('dims unlit segments', () => {
    const { gl } = createFakeGL()
    const stage = createMapStage(document.createElement('div'), { ak: 'test', style: paperStyle, gl })
    stage.render(makeRoute(4), { litSegment: 2, mode: 'walk' })
    const dim = stage.debugState().polylines.filter((p: any) => p.opacity < 0.35).length
    expect(dim).toBeGreaterThan(0)
  })
  it('applies paper style to map', () => {
    const { gl, state } = createFakeGL()
    createMapStage(document.createElement('div'), { ak: 'test', style: paperStyle, gl })
    expect(state.style).toBe(paperStyle)
  })
  it('clear removes overlays', () => {
    const { gl, state } = createFakeGL()
    const stage = createMapStage(document.createElement('div'), { ak: 'test', style: paperStyle, gl })
    stage.render(makeRoute(2), { litSegment: 2, mode: 'walk' })
    stage.clear()
    expect(state.polylines).toHaveLength(0)
    expect(state.markers).toHaveLength(0)
  })
  it('fit calls setViewport', () => {
    const { gl, state } = createFakeGL()
    const stage = createMapStage(document.createElement('div'), { ak: 'test', style: paperStyle, gl })
    stage.fit([{ lng: 116.4, lat: 39.9 }, { lng: 116.41, lat: 39.91 }])
    expect(state.viewport).toBe(1)
  })
})
