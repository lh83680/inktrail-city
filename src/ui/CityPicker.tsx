import { useEffect, useRef } from 'react'
import type { useWorkStore } from '../state/store'

type Store = ReturnType<typeof useWorkStore>

/** 城市/起点选择：BMapGL.Autocomplete（输入提示） */
const INPUT_ID = 'inktrail-city-input'

export function CityPicker({ store }: { store: Store }) {
  const acRef = useRef<any>(null)

  useEffect(() => {
    const gl = (window as any).BMapGL
    const input = document.getElementById(INPUT_ID)
    if (!gl || !input || acRef.current) return
    try {
      // GL 版 Autocomplete 的 input 参数是元素 id 字符串（非元素本体）
      const ac = new gl.Autocomplete({
        input: INPUT_ID,
        location: store.city || '全国',
        onConfirm: (rs: any) => {
          const poi = rs.getPoi?.(0)
          if (poi?.point) {
            store.setCenter({ lng: poi.point.lng, lat: poi.point.lat })
            store.setCity(poi.city || poi.province || store.city)
          }
        },
      })
      acRef.current = ac
      // 不 dispose：GL Autocomplete 的下拉为模块级单例，dev 双调用下 dispose 后再建会崩
    } catch {
      /* Autocomplete 不可用时退化为纯文本输入 */
    }
  }, [store])

  return (
    <label className="field">
      <span className="field-label">在哪座城写？</span>
      <input
        id={INPUT_ID}
        className="field-input"
        placeholder="输入城市或地标（如：上海外滩）"
        defaultValue={store.city}
      />
    </label>
  )
}
