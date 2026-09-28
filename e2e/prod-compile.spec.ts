import { test, expect } from '@playwright/test'
test('prod story cards', async ({ page }) => {
  test.setTimeout(540000)
  await page.goto('https://inktrail-city-ntvxzygae05.qoder.website/')
  await page.getByRole('button', { name: /这一次/ }).waitFor({ state: 'visible', timeout: 240000 })
  await page.getByRole('button', { name: /这一次/ }).click()
  await page.getByPlaceholder('一个字或一句话').fill('福')
  await page.getByRole('button', { name: '编译成路线' }).click()
  await expect(page.locator('.stats dd').first()).toBeVisible({ timeout: 300000 })
  console.log('STORY_COUNT:', await page.locator('.story-card').count())
  console.log('STORY_FIRST:', await page.locator('.story-card').first().textContent().catch(() => 'none'))
  console.log('DONE')
})
