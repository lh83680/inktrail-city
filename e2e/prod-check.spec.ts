import { test, expect } from '@playwright/test'
test('prod site loads and map inits', async ({ page }) => {
  test.setTimeout(240000)
  page.on('pageerror', (e) => console.log('PAGEERROR:', (e.stack || e.message).slice(0, 200)))
  const resp = await page.goto('https://inktrail-city-ntvxzygae05.qoder.website/')
  console.log('HTTP:', resp?.status())
  console.log('TITLE:', await page.title())
  const font = await page.evaluate(async () => {
    const r = await fetch('/assets/fonts/ink-glyphs.ttf')
    return r.status
  })
  console.log('FONT_HTTP:', font)
  await page.waitForFunction(() => typeof (window as any).BMapGL?.Map === 'function', null, { timeout: 120000 })
  console.log('BMAPGL: ready')
  const mapBox = await page.locator('.map-holder').boundingBox()
  console.log('MAP_BOX:', JSON.stringify(mapBox))
})
