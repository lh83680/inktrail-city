import { test, expect } from '@playwright/test'
test('fu legibility at city scale', async ({ page }) => {
  test.setTimeout(540000)
  await page.goto('http://inktrail.localhost:5173/')
  await page.getByRole('button', { name: /这一次/ }).waitFor({ state: 'visible', timeout: 240000 })
  await page.getByRole('button', { name: /这一次/ }).click()
  await page.getByPlaceholder('一个字或一句话').fill('福')
  await page.getByRole('button', { name: '编译成路线' }).click()
  await expect(page.locator('.stats dd').first()).toBeVisible({ timeout: 300000 })
  await page.waitForTimeout(5000)
  console.log('STATS:', (await page.locator('.stats').textContent())?.replace(/\s+/g, ' '))
  await page.screenshot({ path: 'e2e/artifacts/fu-legibility.png' })
  console.log('SHOT_DONE')
})
