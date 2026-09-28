import { useEffect, useRef } from 'react'
import { useStrokeCapture } from '../lib/ink/useStrokeCapture'
import type { useWorkStore } from '../state/store'

type Store = ReturnType<typeof useWorkStore>

export function DrawPanel({ store }: { store: Store }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { strokes, clear, undo, handlers } = useStrokeCapture(canvasRef)

  useEffect(() => {
    store.setStrokes(strokes)
  }, [strokes, store])

  return (
    <section className="panel">
      <label className="field">
        <span className="field-label">想写什么字？</span>
        <input
          className="field-input"
          placeholder="一个字或一句话"
          value={store.text}
          maxLength={12}
          onChange={(e) => store.setText(e.target.value)}
        />
      </label>
      <div className="btn-row">
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => store.compile('walk')}
          disabled={store.status === 'compiling'}
        >
          {store.status === 'compiling' ? '编译中…' : '编译成路线'}
        </button>
        <button
          type="button"
          className="btn"
          onClick={() => store.compile('ride')}
          disabled={store.status === 'compiling'}
        >
          骑行版
        </button>
      </div>
      <p className="hint">留空字库生成；也可在下方手写板落墨（取第一笔）。</p>
      <canvas
        ref={canvasRef}
        className="ink-canvas"
        width={320}
        height={200}
        onPointerDown={handlers.onPointerDown}
        onPointerMove={handlers.onPointerMove}
        onPointerUp={handlers.onPointerUp}
        onPointerLeave={handlers.onPointerUp}
      />
      <div className="btn-row">
        <button type="button" className="btn" onClick={clear}>
          清空墨稿
        </button>
        <button type="button" className="btn" onClick={undo}>
          撤销一笔
        </button>
      </div>
      <p className="hint">笔画数量：{strokes.length}</p>
    </section>
  )
}
