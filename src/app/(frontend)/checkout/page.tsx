import { CheckoutPageClient } from '@/components/store/CheckoutPageClient'
import { StoreFooter } from '@/components/store/StoreFooter'
import { StoreHeader } from '@/components/store/StoreHeader'

export default function CheckoutPage() {
  return (
    <div className="min-h-screen bg-[#fbf7f1]">
      <StoreHeader />
      <div className="container-shell py-8 sm:py-10">
        <CheckoutPageClient />
      </div>
      <StoreFooter />
    </div>
  )
}
