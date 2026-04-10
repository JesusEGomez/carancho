import crypto from 'crypto'

import { describe, expect, it } from 'vitest'
import type { PaymentResponse } from 'mercadopago/dist/clients/payment/commonTypes'

import {
  buildMercadoPagoWebhookManifest,
  buildPreferenceRequest,
  mapMercadoPagoPayment,
  verifyMercadoPagoWebhookSignature,
} from '@/lib/mercadopago/shared'

describe('Mercado Pago helpers', () => {
  it('builds a checkout preference with return and notification urls', () => {
    const preference = buildPreferenceRequest({
      externalReference: 'order-123',
      items: [
        {
          currency_id: 'ARS',
          id: '1',
          quantity: 2,
          title: 'Producto test',
          unit_price: 1500,
        },
      ],
      metadata: {
        confirmationToken: 'token-123',
        orderId: 99,
      },
      notificationUrl: 'https://example.com/api/payments/mercadopago/webhook',
      payer: {
        email: 'buyer@example.com',
      },
      publicBaseUrl: 'https://example.com',
    })

    expect(preference.auto_return).toBe('approved')
    expect(preference.notification_url).toBe('https://example.com/api/payments/mercadopago/webhook')
    expect(preference.back_urls?.success).toBe('https://example.com/checkout/retorno/success/99?token=token-123')
    expect(preference.external_reference).toBe('order-123')
  })

  it('maps approved payments to confirmed local orders', () => {
    const result = mapMercadoPagoPayment({
      api_response: {
        headers: {},
        status: 200,
      },
      id: 1234,
      status: 'approved',
      status_detail: 'accredited',
    } as PaymentResponse)

    expect(result.orderStatus).toBe('confirmed')
    expect(result.paymentStatus).toBe('approved')
    expect(result.providerPaymentId).toBe('1234')
    expect(result.providerRawStatus).toBe('approved:accredited')
  })

  it('preserves refunded and charged back payment states for local reconciliation', () => {
    const refunded = mapMercadoPagoPayment({
      api_response: {
        headers: {},
        status: 200,
      },
      id: 55,
      status: 'refunded',
      status_detail: 'refunded',
    } as PaymentResponse)

    const chargedBack = mapMercadoPagoPayment({
      api_response: {
        headers: {},
        status: 200,
      },
      id: 56,
      status: 'charged_back',
      status_detail: 'chargeback',
    } as PaymentResponse)

    expect(refunded.orderStatus).toBe('cancelled')
    expect(refunded.paymentStatus).toBe('refunded')
    expect(chargedBack.orderStatus).toBe('cancelled')
    expect(chargedBack.paymentStatus).toBe('charged_back')
  })

  it('validates webhook signatures using the official manifest format', () => {
    const secret = 'super-secret'
    const manifest = buildMercadoPagoWebhookManifest('123456', 'req-abc', '1742505638683')
    const v1 = crypto.createHmac('sha256', secret).update(manifest).digest('hex')

    expect(
      verifyMercadoPagoWebhookSignature({
        dataId: '123456',
        requestId: 'req-abc',
        secret,
        signatureHeader: `ts=1742505638683,v1=${v1}`,
      }),
    ).toBe(true)
  })
})
