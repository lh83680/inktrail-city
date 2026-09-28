import { test } from '@playwright/test'
test('autocomplete dom dump', async ({ page }) => {
  test.setTimeout(560000)
  await page.goto('https://inktrail-city-ntvxzygae05.qoder.website/')
  await page.getByRole('button', { name: /这一次/ }).waitFor({ state: 'visible', timeout: 240000 })
  await page.getByRole('button', { name: /这一次/ }).click()
  const input = page.locator('#inktrail-city-input')
  await input.click()
  await input.fill('上海')
  await page.waitForTimeout(4000)
  const dump = await page.evaluate(() => {
    const cands = [...document.querySelectorAll('body > div, body > ul, [class*=suggest], [class*=Suggestion]')]
      .filter(el => el.offsetParent !== null)
      .map(el => ({ cls: (el.className || '').toString().slice(0, 60), txt: (el.textContent || '').slice(0, 60) }))
    return cands.slice(0, 8)
  })
  console.log('DUMP:', JSON.stringify(dump))
})
