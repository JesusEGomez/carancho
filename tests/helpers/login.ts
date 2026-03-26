import type { Page } from '@playwright/test'
import { expect } from '@playwright/test'

export interface LoginOptions {
  page: Page
  serverURL?: string
  user: {
    email: string
    password: string
  }
}

/**
 * Logs the user into the admin panel via the login page.
 */
export async function login({
  page,
  serverURL = 'http://localhost:3000',
  user,
}: LoginOptions): Promise<void> {
  await page.goto(`${serverURL}/admin/login`)

  await page.fill('input[type="email"]', user.email)
  await page.fill('input[type="password"]', user.password)
  await page.click('button[type="submit"]')

  await page.waitForURL(`${serverURL}/admin`)

  const dashboardArtifact = page.locator('h2', { hasText: 'Gestion comercial' })
  await expect(dashboardArtifact).toBeVisible()
}
