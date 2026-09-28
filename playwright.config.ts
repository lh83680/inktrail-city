import { defineConfig, devices } from '@playwright/test'
import { resolve6 } from 'node:dns/promises'

// 本机 IPv4 到 api.map.baidu.com 被网络重置（ERR_CONNECTION_CLOSED），IPv6 可达。
// 自动化浏览器需强制走 IPv6（E2E 专用，线上部署不受影响——评审端网络可达）。
let ipv6: string | undefined
try {
  const list = await resolve6('api.map.baidu.com')
  ipv6 = list[0]
} catch {
  ipv6 = undefined
}
const resolverArgs = ipv6 ? [`--host-resolver-rules=MAP api.map.baidu.com [${ipv6}]`] : []
// 新 Chromium 无 Software WebGL 标志时 GL 库初始化失败
const glArgs = ['--enable-unsafe-swiftshader', '--use-gl=angle', '--use-angle=swiftshader']

export default defineConfig({
  testDir: './e2e',
  timeout: 60_000,
  use: {
    baseURL: 'http://localhost:5173',
    launchOptions: { args: [...resolverArgs, ...glArgs] },
    ...devices['Desktop Chrome'],
  },
  webServer: {
    command: 'npm run dev -- --port 5173 --strictPort',
    url: 'http://localhost:5173',
    reuseExistingServer: true,
  },
})
