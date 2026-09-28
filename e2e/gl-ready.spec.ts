import { test } from '@playwright/test'
test('walk route marker', async ({ page }) => {
  page.on('pageerror', (e) => console.log('PAGEERROR:', e.message.slice(0, 150)))
  await page.goto('http://inktrail.localhost:5173/tools/ak-check.html')
  await page.waitForTimeout(30000)
  const log = await page.evaluate(() => document.getElementById('log')?.textContent ?? '')
  console.log('HAS_WALK:', log.includes('WALK_OK'))
  console.log('TAIL:', log.split('\n').slice(-3).join(' | ').slice(0, 200))
})
