import { expect, test, type APIRequestContext, type BrowserContext, type Page } from '@playwright/test'

import {
  countOtherOfferProducts,
  deleteOrders,
  getOrder,
  paymentPriceProducts,
  seedPaymentPriceCatalog,
  setShowInOffers,
  type SeededPaymentProducts,
} from '../helpers/seedPaymentPrices'
import { seedTestUser, testUser } from '../helpers/seedUser'

const BASE_URL = process.env.E2E_BASE_URL ?? 'http://localhost:3000'
const SCREENSHOT_DIR = process.env.E2E_SCREENSHOT_DIR

const money = (value: number) =>
  new Intl.NumberFormat('es-AR', { currency: 'ARS', maximumFractionDigits: 0, style: 'currency' }).format(value)

const customer = {
  customerEmail: 'cliente.e2e@example.test',
  customerName: 'Cliente E2E',
  customerPhone: '1155550000',
  deliveryAddress: 'Calle Falsa 1234',
  deliveryCity: 'Rosario',
  deliveryNotes: '',
}

const { cashOnly, multiPrice } = paymentPriceProducts

let seeded: SeededPaymentProducts
const createdOrderIds: number[] = []

async function screenshot(page: Page, name: string) {
  if (SCREENSHOT_DIR) {
    await page.screenshot({ fullPage: false, path: `${SCREENSHOT_DIR}/${name}.png` })
  }
}

/** Never let the browser reach WhatsApp or Mercado Pago: stub popups and block external hosts. */
async function isolateExternalServices(context: BrowserContext) {
  await context.addInitScript(() => {
    const fakePopup = { closed: false, close() {}, focus() {}, location: { href: '' }, opener: null }
    window.open = (() => fakePopup) as unknown as typeof window.open
  })
  await context.route(/^https?:\/\/(?!localhost|127\.0\.0\.1)[^/]+/, (route) => route.abort())
}

async function createWhatsAppOrder(request: APIRequestContext, paymentMethod: 'cash' | 'transfer', quantity = 1) {
  const response = await request.post(`${BASE_URL}/api/checkout/create-whatsapp`, {
    data: {
      customer,
      items: [{ productId: seeded.multiPrice.id, quantity }],
      paymentMethod,
    },
  })
  expect(response.status()).toBe(201)
  const body = (await response.json()) as { orderId: number }
  createdOrderIds.push(body.orderId)

  return body.orderId
}

test.describe.configure({ mode: 'serial' })

test.beforeAll(async () => {
  seeded = await seedPaymentPriceCatalog()
})

test.afterAll(async () => {
  await deleteOrders(createdOrderIds)
})

test.describe('Payment method prices - storefront', () => {
  test('product detail with only the cash price shows no payment method cards', async ({ page }) => {
    await page.goto(`${BASE_URL}/productos/${cashOnly.slug}`)

    await expect(page.getByRole('heading', { level: 1, name: cashOnly.name })).toBeVisible()
    await expect(page.getByText(money(cashOnly.price)).first()).toBeVisible()
    await expect(page.getByText('Precio según medio de pago')).toHaveCount(0)
    await expect(page.getByText('Precio en efectivo')).toHaveCount(0)
    await expect(page.getByText(/Envío gratis/i)).toHaveCount(0)
  })

  test('product detail with transfer and card prices shows one card per method and the discount', async ({ page }) => {
    await page.goto(`${BASE_URL}/productos/${multiPrice.slug}`)

    await expect(page.getByRole('heading', { level: 1, name: multiPrice.name })).toBeVisible()
    await expect(page.getByText('Precio en efectivo')).toBeVisible()
    await expect(page.getByText(/Envío gratis/i)).toHaveCount(0)

    const expectedDiscount = Math.round(
      ((multiPrice.compareAtPrice - multiPrice.price) / multiPrice.compareAtPrice) * 100,
    )
    await expect(page.getByText(`-${expectedDiscount}%`, { exact: true })).toBeVisible()
    await expect(page.getByText(money(multiPrice.compareAtPrice), { exact: true })).toBeVisible()

    const cards = page.locator('ul').filter({ hasText: 'Efectivo' }).filter({ hasText: 'Tarjeta' }).locator('li')
    await expect(cards).toHaveCount(3)
    await expect(cards.nth(0)).toContainText('Efectivo')
    await expect(cards.nth(0)).toContainText(money(multiPrice.price))
    await expect(cards.nth(1)).toContainText('Transferencia')
    await expect(cards.nth(1)).toContainText(money(multiPrice.transferPrice))
    await expect(cards.nth(2)).toContainText('Tarjeta')
    await expect(cards.nth(2)).toContainText(money(multiPrice.cardPrice))

    await screenshot(page, 'product-detail-price-cards')
  })

  test('catalog card shows the card price only when the product has one', async ({ page }) => {
    await page.goto(`${BASE_URL}/productos?q=E2E`)

    const multiCard = page.locator(`a[href="/productos/${multiPrice.slug}"]`).filter({ hasText: multiPrice.name })
    await expect(multiCard).toContainText(`${money(multiPrice.cardPrice)} con tarjeta`)

    const cashCard = page.locator(`a[href="/productos/${cashOnly.slug}"]`).filter({ hasText: cashOnly.name })
    await expect(cashCard).toContainText(money(cashOnly.price))
    await expect(cashCard).not.toContainText('con tarjeta')
  })

  test('home shows the offers carousel under the categories when a product is in offers', async ({ page }) => {
    await page.goto(`${BASE_URL}/`)

    const offers = page.getByRole('region', { name: 'Ofertas' })
    await expect(offers).toBeVisible()
    await expect(offers.getByRole('heading', { name: 'Ofertas' })).toBeVisible()
    await expect(offers.getByText(multiPrice.name)).toBeVisible()

    const offersSection = page.locator('section#ofertas')
    const newArrivals = page.getByRole('heading', { name: 'Nuevos ingresos' })
    const offersBox = await offersSection.boundingBox()
    const newArrivalsBox = await newArrivals.boundingBox()
    expect(offersBox && newArrivalsBox && offersBox.y < newArrivalsBox.y).toBeTruthy()

    const categoriesCarousel = page.locator('section').filter({ has: page.locator('[aria-roledescription="carrusel"]') }).first()
    if ((await categoriesCarousel.count()) > 0 && !(await categoriesCarousel.evaluate((node) => node.id === 'ofertas'))) {
      const categoriesBox = await categoriesCarousel.boundingBox()
      expect(categoriesBox && offersBox && categoriesBox.y < offersBox.y).toBeTruthy()
    }
  })

  test('home hides the offers carousel when no product is in offers', async ({ page }) => {
    const others = await countOtherOfferProducts([seeded.multiPrice.id, seeded.cashOnly.id])
    test.skip(others > 0, `${others} other published product(s) are in offers in this database`)

    await setShowInOffers(seeded.multiPrice.id, false)
    try {
      await page.goto(`${BASE_URL}/`)
      await expect(page.getByRole('heading', { name: 'Nuevos ingresos' })).toBeVisible()
      await expect(page.getByText(multiPrice.name)).toHaveCount(0)

      // Outside production the storefront falls back to demo offers when the CMS has none,
      // so the carousel can only be asserted absent when that fallback is turned off.
      if (process.env.STORE_PREVIEW_FALLBACK === 'false') {
        await expect(page.getByRole('region', { name: 'Ofertas' })).toHaveCount(0)
        await expect(page.locator('section#ofertas')).toHaveCount(0)
      } else {
        test.info().annotations.push({
          description: 'Set STORE_PREVIEW_FALLBACK=false on the server and test runner to assert the carousel is absent.',
          type: 'partial',
        })
      }
    } finally {
      await setShowInOffers(seeded.multiPrice.id, true)
    }
  })
})

test.describe('Payment method prices - checkout', () => {
  test('shows per-option totals and stores the transfer method and total on WhatsApp orders', async ({
    context,
    page,
  }) => {
    await isolateExternalServices(context)
    const quantity = 2

    await page.goto(`${BASE_URL}/productos/${multiPrice.slug}`)
    await page.getByRole('button', { name: 'Sumar una unidad' }).click()
    await page.getByRole('button', { exact: true, name: 'Añadir al carrito' }).first().click()
    await expect
      .poll(() => page.evaluate(() => window.localStorage.getItem('carancho-store-cart') ?? ''))
      .toContain(`"quantity":${quantity}`)

    await page.goto(`${BASE_URL}/checkout`)
    await expect(page.getByTestId('checkout-total-card')).toHaveText(money(multiPrice.cardPrice * quantity))
    await expect(page.getByTestId('checkout-total-cash')).toHaveText(money(multiPrice.price * quantity))
    await expect(page.getByTestId('checkout-total-transfer')).toHaveText(money(multiPrice.transferPrice * quantity))

    await page.locator('#customerName').fill(customer.customerName)
    await page.locator('#customerEmail').fill(customer.customerEmail)
    await page.locator('#customerPhone').fill(customer.customerPhone)
    await page.locator('#deliveryCity').fill(customer.deliveryCity)
    await page.locator('#deliveryAddress').fill(customer.deliveryAddress)
    await page.getByRole('radio', { name: 'Transferencia' }).check()

    await screenshot(page, 'checkout-payment-options')

    const responsePromise = page.waitForResponse(
      (response) => response.url().includes('/api/checkout/create-whatsapp') && response.request().method() === 'POST',
    )
    await page.getByRole('button', { name: 'Pedir por WhatsApp' }).click()
    const response = await responsePromise
    expect(response.status()).toBe(201)
    expect(response.request().postDataJSON()).toMatchObject({ paymentMethod: 'transfer' })

    const { orderId } = (await response.json()) as { orderId: number }
    createdOrderIds.push(orderId)
    await expect(page).toHaveURL(new RegExp(`/checkout/confirmacion/${orderId}`))

    const order = await getOrder(orderId)
    expect(order.paymentMethod).toBe('transfer')
    expect(order.paymentProvider).toBe('whatsapp')
    expect(order.status).toBe('pending_whatsapp')
    expect(order.total).toBe(multiPrice.transferPrice * quantity)
  })
})

test.describe('Payment method prices - admin order actions', () => {
  let adminPage: Page

  test.beforeAll(async ({ browser }) => {
    await seedTestUser()
    const context = await browser.newContext()
    await isolateExternalServices(context)
    adminPage = await context.newPage()
    // The shared login helper still expects the old dashboard heading, so log in here.
    await adminPage.goto(`${BASE_URL}/admin/login`)
    await adminPage.fill('input[type="email"]', testUser.email)
    await adminPage.fill('input[type="password"]', testUser.password)
    await adminPage.click('button[type="submit"]')
    await adminPage.waitForURL(`${BASE_URL}/admin`)
    await expect(adminPage.getByRole('heading', { level: 1, name: 'Gestión Comercial' })).toBeVisible()
  })

  test.afterAll(async () => {
    await adminPage?.context().close()
  })

  test('switches transfer to cash, then finalizes through the confirmation dialog', async ({ request }) => {
    const orderId = await createWhatsAppOrder(request, 'transfer')
    const page = adminPage

    await page.goto(`${BASE_URL}/admin/ordenes/${orderId}`)
    const total = page.getByText('Total', { exact: true }).locator('..')
    await expect(page.getByText('Pendiente por WhatsApp')).toBeVisible()
    await expect(total).toContainText(money(multiPrice.transferPrice))

    await page.getByRole('button', { name: 'Cambiar a Efectivo' }).click()
    await expect(page.getByRole('button', { name: 'Cambiar a Transferencia' })).toBeVisible()
    await expect(total).toContainText(money(multiPrice.price))
    await expect.poll(async () => (await getOrder(orderId)).total).toBe(multiPrice.price)
    expect((await getOrder(orderId)).paymentMethod).toBe('cash')

    await page.getByRole('button', { name: 'Dar por finalizada' }).click()
    const dialog = page.getByRole('alertdialog', { name: '¿Finalizar la orden?' })
    await expect(dialog).toBeVisible()
    await expect(dialog).toContainText('Medio de pago registrado: Efectivo')
    await expect(dialog).toContainText(`Total: ${money(multiPrice.price)}`)
    await screenshot(page, 'admin-finalize-dialog')

    await dialog.getByRole('button', { name: 'Cancelar y actualizar' }).click()
    await expect(dialog).toHaveCount(0)
    await expect(page.getByText('Pendiente por WhatsApp')).toBeVisible()
    expect((await getOrder(orderId)).status).toBe('pending_whatsapp')

    await page.getByRole('button', { name: 'Dar por finalizada' }).click()
    await expect(dialog).toBeVisible()
    await dialog.getByRole('button', { name: 'Sí, finalizar' }).click()
    await expect(dialog).toHaveCount(0)
    await expect(page.getByText('Confirmada').first()).toBeVisible()
    await expect.poll(async () => (await getOrder(orderId)).status).toBe('confirmed')

    // Non-pending orders expose none of the WhatsApp order actions.
    await page.reload()
    await expect(page.getByText('Confirmada').first()).toBeVisible()
    await expect(page.getByRole('button', { name: /Cambiar a/ })).toHaveCount(0)
    await expect(page.getByRole('button', { name: 'Dar por finalizada' })).toHaveCount(0)
    await expect(page.getByRole('button', { name: 'Cancelar orden' })).toHaveCount(0)
  })

  test('cancels another pending WhatsApp order', async ({ request }) => {
    const orderId = await createWhatsAppOrder(request, 'cash')
    const page = adminPage

    await page.goto(`${BASE_URL}/admin/ordenes/${orderId}`)
    await expect(page.getByText('Pendiente por WhatsApp')).toBeVisible()

    await page.getByRole('button', { name: 'Cancelar orden' }).click()
    const dialog = page.getByRole('alertdialog', { name: '¿Cancelar la orden?' })
    await expect(dialog).toBeVisible()
    await dialog.getByRole('button', { name: 'Sí, cancelar orden' }).click()
    await expect(dialog).toHaveCount(0)

    await expect(page.getByText('Cancelada').first()).toBeVisible()
    await expect.poll(async () => (await getOrder(orderId)).status).toBe('cancelled')
    await expect(page.getByRole('button', { name: 'Cancelar orden' })).toHaveCount(0)
    await expect(page.getByRole('button', { name: 'Dar por finalizada' })).toHaveCount(0)
    await expect(page.getByRole('button', { name: /Cambiar a/ })).toHaveCount(0)
  })
})
