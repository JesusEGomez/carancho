'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

import type { CartProductSnapshot } from '@/lib/cart'
import { useCart } from '@/providers/CartProvider'

export function ProductPurchasePanel({ product }: { product: CartProductSnapshot }) {
  const router = useRouter()
  const { addItem } = useCart()
  const [quantity, setQuantity] = useState(1)

  const isOutOfStock = product.stock < 1

  const updateQuantity = (nextQuantity: number) => {
    setQuantity(Math.max(1, Math.min(nextQuantity, Math.max(product.stock, 1))))
  }

  const handleAddToCart = () => {
    addItem(product, quantity)
  }

  const handleBuyNow = () => {
    addItem(product, quantity)
    router.push('/checkout')
  }

  return (
    <>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <div className="inline-flex h-12 items-center rounded-full border border-slate-200 bg-white px-2 text-sm font-black text-brand-ink shadow-[0_10px_24px_rgba(15,23,42,0.06)] transition-shadow hover:shadow-[0_14px_28px_rgba(15,23,42,0.10)]">
          <button
            aria-label="Restar una unidad"
            className="btn-press flex h-8 w-8 items-center justify-center rounded-full text-lg text-slate-500 transition-colors hover:bg-[#fff2eb] hover:text-brand-orange disabled:cursor-not-allowed disabled:text-slate-300"
            disabled={isOutOfStock}
            onClick={() => updateQuantity(quantity - 1)}
            type="button"
          >
            −
          </button>
          <span className="min-w-12 text-center text-base text-brand-ink">{quantity}</span>
          <button
            aria-label="Sumar una unidad"
            className="btn-press flex h-8 w-8 items-center justify-center rounded-full text-lg text-slate-500 transition-colors hover:bg-[#fff2eb] hover:text-brand-orange disabled:cursor-not-allowed disabled:text-slate-300"
            disabled={isOutOfStock}
            onClick={() => updateQuantity(quantity + 1)}
            type="button"
          >
            +
          </button>
        </div>
        <button
          className="orange-button btn-press h-12 min-w-[220px] disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none"
          disabled={isOutOfStock}
          onClick={handleAddToCart}
          type="button"
        >
          Añadir al carrito
        </button>
      </div>

      <p className="mt-3 text-sm font-medium text-slate-500">
        {isOutOfStock
          ? 'Este producto no tiene stock disponible por el momento.'
          : `Llevando ${quantity} unidad${quantity === 1 ? '' : 'es'}: ${new Intl.NumberFormat('es-AR', {
              style: 'currency',
              currency: 'ARS',
              maximumFractionDigits: 0,
            }).format(product.price * quantity)}`}
      </p>

      <button
        className="btn-press mt-3 h-12 w-full rounded-full border border-slate-200 bg-white text-sm font-black uppercase tracking-[0.12em] text-brand-ink shadow-[0_10px_24px_rgba(15,23,42,0.06)] transition-all duration-200 hover:-translate-y-0.5 hover:border-brand-orange hover:bg-[#fff7f1] hover:text-brand-orange hover:shadow-[0_16px_28px_rgba(240,97,25,0.12)] disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none sm:max-w-[220px]"
        disabled={isOutOfStock}
        onClick={handleBuyNow}
        type="button"
      >
        Comprar ahora
      </button>
    </>
  )
}
