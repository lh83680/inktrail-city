import { test, expect } from '@playwright/test'

test('BMapGL loads with AK and route/POI/geocode work', async ({ page }) => {
  await page.goto("http://inktrail.localhost:5173/tools/ak-check.html")
  const log = page.locator('#log')
  await expect.poll(() => log.textContent(), { timeout: 40000 }).toContain('map ready')
  await expect.poll(() => log.textContent(), { timeout: 40000 }).toContain('WALK_OK')
  await expect.poll(() => log.textContent(), { timeout: 40000 }).toContain('POI_OK')
  await expect.poll(() => log.textContent(), { timeout: 40000 }).toContain('GEOCODE_OK')
})
