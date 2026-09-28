import { test, expect } from '@playwright/test'
test('new features + mobile', async ({ page }) => {
  test.setTimeout(560000)
  page.on('pageerror', (e) => console.log('PAGEERROR:', (e.stack || e.message).slice(0, 180)))
  // 移动视口
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('http://inktrail.localhost:5173/')
  await page.getByRole('button', { name: /这一次/ }).waitFor({ state: 'visible', timeout: 240000 })
  await page.getByRole('button', { name: /这一次/ }).click()
  // 城市选择器输入（触发 Autocomplete 下拉）
  await page.getByPlaceholder('输入城市或地标（如：上海外滩）').click()
  await page.getByPlaceholder('输入城市或地标（如：上海外滩）').fill('上海')
  await page.waitForTimeout(3000)
  console.log('AUTocomplete items:', await page.locator('.BMap_autocomplete, [class*=autocomplete] .pac-container, [class*=Autocomplete]').count())
  // 编译
  await page.getByPlaceholder('一个字或一句话').fill('福')
  await page.getByRole('button', { name: '编译成路线' }).click()
  await expect(page.locator('.stats dd').first()).toBeVisible({ timeout: 300000 })
  console.log('STATS:', (await page.locator('.stats').textContent())?.replace(/\s+/g, ' '))
  // 街景容器
  console.log('STREETBOX:', await page.locator('.street-view').boundingBox().then(b => JSON.stringify(b)))
  // 海报（触发 download）
  const dl = page.waitForEvent('download', { timeout: 30000 }).catch(() => null)
  await page.getByRole('button', { name: '生成海报' }).click()
  const d = await dl
  console.log('POSTER_DL:', d ? d.suggestedFilename() : 'none')
  await page.screenshot({ path: 'e2e/artifacts/mobile-features.png' })
  console.log('DONE')
})
