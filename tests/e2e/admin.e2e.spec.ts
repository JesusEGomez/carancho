import { test, expect, Page } from '@playwright/test'
import { login } from '../helpers/login'
import { seedTestUser, cleanupTestUser, testUser } from '../helpers/seedUser'
import { seedCatalog } from '../helpers/seedCatalog'

test.describe('Admin Panel', () => {
  let page: Page

  test.beforeAll(async ({ browser }, testInfo) => {
    await seedTestUser()
    await seedCatalog()

    const context = await browser.newContext()
    page = await context.newPage()

    await login({ page, user: testUser })
  })

  test.afterAll(async () => {
    await cleanupTestUser()
  })

  test('can navigate to dashboard', async () => {
    await page.goto('http://localhost:3000/admin')
    await expect(page).toHaveURL('http://localhost:3000/admin')
    const dashboardArtifact = page.locator('h2', { hasText: 'Gestion comercial' }).first()
    await expect(dashboardArtifact).toBeVisible()
  })

  test('can navigate to inventory view', async () => {
    await page.goto('http://localhost:3000/admin/productos')
    await expect(page).toHaveURL('http://localhost:3000/admin/productos')
    const listViewArtifact = page.locator('h1', { hasText: 'Lista de productos' }).first()
    await expect(listViewArtifact).toBeVisible()
  })

  test('payload native admin stays available', async () => {
    await page.goto('http://localhost:3000/payload-admin')
    await expect(page).toHaveURL(/\/payload-admin/)
    const payloadAdminArtifact = page.locator('a', { hasText: 'Collections' }).first()
    await expect(payloadAdminArtifact).toBeVisible()
  })

  test('can navigate to create product view', async () => {
    await page.goto('http://localhost:3000/admin/productos/nuevo')
    await expect(page).toHaveURL('http://localhost:3000/admin/productos/nuevo')
    const editViewArtifact = page.locator('h1', { hasText: 'Nuevo producto' })
    await expect(editViewArtifact).toBeVisible()
  })
})
