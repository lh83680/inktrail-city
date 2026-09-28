import { test } from '@playwright/test'

test('diagnose baidu script loading', async ({ page }) => {
  page.on('console', (m) => console.log('CONSOLE:', m.type(), m.text().slice(0, 200)))
  page.on('pageerror', (e) => console.log('PAGEERROR:', e.message.slice(0, 200)))
  page.on('requestfailed', (r) => console.log('REQFAIL:', r.url().slice(0, 120), r.failure()?.errorText))
  page.on('response', (r) => { if (r.url().includes('baidu')) console.log('RESP:', r.status(), r.url().slice(0, 110)) })
  await page.goto('/tools/ak-check.html')
  await page.waitForTimeout(20000)
  console.log('LOG TEXT:', (await page.locator('#log').textContent())?.slice(0, 400))
})
