import { expect, test } from '@playwright/test'

const admin = { id: 1, email: 'admin@example.test', name: 'Admin', role: 'admin' }
const categories = {
  docs: [
    { id: 11, name: 'Pesca', slug: 'pesca', parent: null },
    { id: 12, name: 'Cañas', slug: 'canas', parent: 11 },
  ],
}

for (const { categoryId, chooseSubcategory, name } of [
  { categoryId: 11, chooseSubcategory: false, name: 'categoría principal' },
  { categoryId: 12, chooseSubcategory: true, name: 'subcategoría' },
]) {
  test(`permite crear un producto con ${name}`, async ({ page }) => {
    let savedCategory: number | undefined

    await page.addInitScript((user) => {
      localStorage.setItem('carancho-admin-token', 'test-token')
      localStorage.setItem('carancho-admin-user', JSON.stringify(user))
    }, admin)

    await page.route('**/api/users/me', (route) =>
      route.fulfill({ json: { user: admin } }),
    )
    await page.route('**/api/categories**', (route) =>
      route.fulfill({ json: categories }),
    )
    await page.route('**/api/media', (route) =>
      route.fulfill({ json: { id: 51, alt: 'Producto de prueba' } }),
    )
    await page.route('**/api/products**', (route) => {
      if (route.request().method() === 'POST') {
        savedCategory = route.request().postDataJSON().category as number
        return route.fulfill({ json: { id: 70, name: 'Producto de prueba' } })
      }

      return route.fulfill({ json: { docs: [] } })
    })

    await page.goto('http://localhost:3000/admin/productos/nuevo')
    await expect(page.getByRole('heading', { name: 'Nuevo producto' })).toBeVisible()
    await page.locator('input[name="name"]').fill('Producto de prueba')
    await page.locator('select[name="parentCategoryId"]').selectOption('11')

    const subcategory = page.getByLabel('Subcategoría (opcional)')
    await expect(subcategory).toBeEnabled()
    await expect(subcategory).toHaveValue('0')
    if (chooseSubcategory) {
      await subcategory.selectOption('12')
    }

    await page.locator('input[name="price"]').fill('1000')
    await page.locator('input[name="stock"]').fill('3')
    await page.locator('textarea[name="shortDescription"]').fill('Descripción corta del producto')
    await page.locator('textarea[name="description"]').fill('Descripción completa del producto de prueba')
    await page.locator('input[type="file"]').first().setInputFiles({
      name: 'producto.png',
      mimeType: 'image/png',
      buffer: Buffer.from(
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScL/nwAAAABJRU5ErkJggg==',
        'base64',
      ),
    })

    await page.getByRole('button', { name: 'Guardar producto' }).click()
    await expect.poll(() => savedCategory).toBe(categoryId)
    await expect(page).toHaveURL('http://localhost:3000/admin/productos')
  })
}

test('permite editar un producto que solo tiene categoría principal', async ({ page }) => {
  let savedCategory: number | undefined

  await page.addInitScript((user) => {
    localStorage.setItem('carancho-admin-token', 'test-token')
    localStorage.setItem('carancho-admin-user', JSON.stringify(user))
  }, admin)

  await page.route('**/api/users/me', (route) =>
    route.fulfill({ json: { user: admin } }),
  )
  await page.route('**/api/categories**', (route) =>
    route.fulfill({ json: categories }),
  )
  await page.route('**/api/products**', (route) => {
    if (route.request().method() === 'PATCH') {
      savedCategory = route.request().postDataJSON().category as number
      return route.fulfill({ json: { id: 70, name: 'Producto de prueba' } })
    }

    if (route.request().url().includes('/products/70')) {
      return route.fulfill({
        json: {
          id: 70,
          name: 'Producto de prueba',
          category: categories.docs[0],
          badges: [],
          compareAtPrice: null,
          description: 'Descripción completa del producto de prueba',
          featuredImage: { id: 51, alt: 'Producto de prueba', url: '/imagen-de-prueba.png' },
          gallery: [],
          isFeatured: false,
          price: 1000,
          shortDescription: 'Descripción corta del producto',
          status: 'published',
          stock: 3,
        },
      })
    }

    return route.fulfill({ json: { docs: [] } })
  })

  await page.goto('http://localhost:3000/admin/productos/70')
  await expect(page.getByRole('heading', { name: 'Editar producto' })).toBeVisible()
  await expect(page.getByLabel('Subcategoría (opcional)')).toHaveValue('0')
  await page.getByRole('button', { name: 'Guardar producto' }).click()

  await expect.poll(() => savedCategory).toBe(11)
  await expect(page).toHaveURL('http://localhost:3000/admin/productos')
})
