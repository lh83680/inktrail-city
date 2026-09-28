import { test, expect } from '@playwright/test'

test('wait for GL class readiness', async ({ page }) => {
  await page.goto('http://inktrail.localhost:5173/tools/ak-check.html')
  const t0 = Date.now()
  try {
    await page.waitForFunction(() => typeof (window as any).BMapGL?.Map === 'function', null, { timeout: 60000 })
    console.log('READY in', Date.now() - t0, 'ms')
  } catch {
    console.log('NOT READY in 60s')
  }
  console.log('LOG:', (await page.locator('#log').textContent())?.slice(0, 400))
  console.log('NMSP:', await page.evaluate(() => Object.keys((window as any).BMapGL || {}).slice(0, 20)))
})
