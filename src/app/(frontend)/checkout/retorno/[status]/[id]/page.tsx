import { notFound } from 'next/navigation'

import { StoreFooter } from '@/components/store/StoreFooter'
import { StoreHeader } from '@/components/store/StoreHeader'
import { CheckoutReturnPageClient } from '@/components/store/CheckoutReturnPageClient'
import { parseMercadoPagoStatusQuery, type MercadoPagoCheckoutStatus } from '@/lib/mercadopago/shared'

type Props = {
  params: Promise<{
    id: string
    status: MercadoPagoCheckoutStatus
  }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export default async function CheckoutMercadoPagoReturnPage({ params, searchParams }: Props) {
  const { id, status } = await params
  const queryParams = await searchParams
  const orderId = Number(id)
  const token = typeof queryParams.token === 'string' ? queryParams.token : null

  if (!token || !Number.isFinite(orderId) || !['success', 'pending', 'failure'].includes(status)) {
    notFound()
  }

  const search = new URLSearchParams()

  for (const [key, value] of Object.entries(queryParams)) {
    if (typeof value === 'string') {
      search.set(key, value)
    }
  }

  return (
    <div className="min-h-screen bg-[#fbf7f1]">
      <StoreHeader />
      <div className="container-shell py-8 sm:py-10">
        <CheckoutReturnPageClient orderId={orderId} query={parseMercadoPagoStatusQuery(search)} returnStatus={status} token={token} />
      </div>
      <StoreFooter />
    </div>
  )
}
