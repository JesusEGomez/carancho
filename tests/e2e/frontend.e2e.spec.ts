import { test, expect, Page } from '@playwright/test'
import { seedCatalog } from '../helpers/seedCatalog'

test.describe('Frontend', () => {
  let page: Page

  test.beforeAll(async ({ browser }, testInfo) => {
    await seedCatalog()
    const context = await browser.newContext()
    page = await context.newPage()
  })

  test('can go on homepage', async ({ page }) => {
    await page.goto('http://localhost:3000')

    await expect(page).toHaveTitle(/Carancho Pesca Deportiva/)

    const heading = page.locator('h1').first()
    await expect(heading).toContainText('Todo para tu aventura y tu hogar')
  })

  test('can browse catalog and detail', async ({ page }) => {
    await page.goto('http://localhost:3000/productos')
    await expect(page.locator('h2', { hasText: 'Productos disponibles' })).toBeVisible()

    await page.click('text=Combo Cana + Reel Marine Sports')

    await expect(page).toHaveURL(/\/productos\/combo-cana-reel-marine-sports/)
    await expect(page.locator('h1', { hasText: 'Combo Cana + Reel Marine Sports' })).toBeVisible()
  })
})
