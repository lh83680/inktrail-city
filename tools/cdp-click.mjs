// CDP 真实鼠标点击：node tools/cdp-click.mjs "<selector>" [waitMs]
const CDP = 'http://localhost:9222'

async function main() {
  const selector = process.argv[2]
  const waitMs = Number(process.argv[3] ?? 1500)
  const targets = await (await fetch(`${CDP}/json/list`)).json()
  const page = targets.find((t) => t.type === 'page') ?? targets[0]
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
  await send('DOM.enable')
  await send('Runtime.enable')
  const doc = await send('DOM.getDocument')
  const node = await send('DOM.querySelector', { nodeId: doc.root.nodeId, selector })
  if (!node.nodeId) {
    console.error('ELEMENT_NOT_FOUND', selector)
    ws.close()
    process.exit(1)
  }
  const box = await send('DOM.getBoxModel', { nodeId: node.nodeId })
  const [x, y] = [box.model.border[0] + 4, box.model.border[1] + 4]
  await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x, y })
  await send('Input.dispatchMouseEvent', { type: 'mousePressed', x, y, button: 'left', clickCount: 1 })
  await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x, y, button: 'left', clickCount: 1 })
  await new Promise((r) => setTimeout(r, waitMs))
  if (process.argv.includes('--shot')) {
    const { data } = await send('Page.captureScreenshot', { format: 'png' })
    const { writeFileSync } = await import('node:fs')
    writeFileSync(process.argv.includes('--shot') ? process.argv[process.argv.indexOf('--shot') + 1] : 'cdp-shot.png', Buffer.from(data, 'base64'))
    console.log('shot saved')
  }
  const res = await send('Runtime.evaluate', { expression: 'location.href', returnByValue: true })
  console.log('clicked', selector, 'url:', res.result.value)
  ws.close()
}

main().catch((e) => {
  console.error('CDP_ERROR:', e.message)
  process.exit(1)
})
