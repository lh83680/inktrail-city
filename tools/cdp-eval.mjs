// 极简 CDP 客户端：在 Edge 调试端口的第一个页面 target 上执行 JS 表达式。
// 用法: node tools/cdp-eval.mjs "<expression>"
const CDP = 'http://localhost:9222'

async function main() {
  const expr = process.argv[2]
  if (!expr) {
    console.error('usage: node tools/cdp-eval.mjs "<expression>"')
    process.exit(1)
  }
  const targets = await (await fetch(`${CDP}/json/list`)).json()
  const page = targets.find((t) => t.type === 'page') ?? targets[0]
  if (!page) {
    console.error('no page target')
    process.exit(1)
  }
  console.error('target:', page.url.slice(0, 120))
  const ws = new WebSocket(page.webSocketDebuggerUrl)
  let id = 1
  const send = (method, params = {}) =>
    new Promise((resolve, reject) => {
      const msgId = id++
      const onMsg = (ev) => {
        const data = JSON.parse(ev.data)
        if (data.id === msgId) {
          ws.removeEventListener('message', onMsg)
          data.error ? reject(new Error(JSON.stringify(data.error))) : resolve(data.result)
        }
      }
      ws.addEventListener('message', onMsg)
      ws.send(JSON.stringify({ id: msgId, method, params }))
    })
  await new Promise((r) => ws.addEventListener('open', r))
  await send('Runtime.enable')
  const res = await send('Runtime.evaluate', {
    expression: expr,
    returnByValue: true,
    awaitPromise: true,
  })
  const value = res.result?.value
  console.log(typeof value === 'string' ? value : JSON.stringify(value, null, 2))
  ws.close()
}

main().catch((e) => {
  console.error('CDP_ERROR:', e.message)
  process.exit(1)
})
