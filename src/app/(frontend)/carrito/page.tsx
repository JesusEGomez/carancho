import { StoreFooter } from '@/components/store/StoreFooter'
import { StoreHeader } from '@/components/store/StoreHeader'
import { CartPageClient } from '@/components/store/CartPageClient'

export default function CartPage() {
  return (
    <div className="min-h-screen bg-[#fbf7f1]">
      <StoreHeader />
      <div className="container-shell py-8 sm:py-10">
        <CartPageClient />
      </div>
      <StoreFooter />
    </div>
  )
}
