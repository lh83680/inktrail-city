let promise: Promise<any> | null = null

/** 加载百度地图 JSAPI GL（callback 单例，重复调用返回同一 Promise）。 */
export function loadBMapGL(): Promise<any> {
  if (promise) return promise
  promise = new Promise((resolve, reject) => {
    const ak = import.meta.env.VITE_BAIDU_AK
    if (!ak) {
      reject(new Error('VITE_BAIDU_AK missing'))
      return
    }
    ;(window as any).onBMapGLReady = () => resolve((window as any).BMapGL)
    const s = document.createElement('script')
    s.src = `https://api.map.baidu.com/api?v=1.0&type=webgl&ak=${ak}&callback=onBMapGLReady`
    s.onerror = () => {
      promise = null
      reject(new Error('BMapGL script load failed'))
    }
    document.head.appendChild(s)
  })
  return promise
}
