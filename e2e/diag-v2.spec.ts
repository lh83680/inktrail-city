import { test } from '@playwright/test'
import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

test('v2.0 API with same AK', async ({ page }) => {
  const here = dirname(fileURLToPath(import.meta.url))
  const html = readFileSync(join(here, '..', 'tools', 'ak-check-v2.html'), 'utf8')
    .replace('__AK__', process.env.VITE_BAIDU_AK ?? '')
  writeFileSync(join(here, '..', 'tools', '.ak-check-v2.rendered.html'), html)
  await page.goto('/tools/.ak-check-v2.rendered.html')
  await page.waitForFunction(() => typeof (window as any).BMap !== 'undefined', null, { timeout: 15000 })
    .then(() => console.log('BMap v2 defined'))
    .catch(() => console.log('BMap v2 NOT defined after 15s'))
  await page.waitForTimeout(10000)
  console.log('LOG TEXT:', (await page.locator('#log').textContent())?.slice(0, 300))
})
