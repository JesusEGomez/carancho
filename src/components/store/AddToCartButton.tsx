'use client'

import type { MouseEvent } from 'react'

import type { CartProductSnapshot } from '@/lib/cart'
import { useCart } from '@/providers/CartProvider'

type AddToCartButtonProps = {
  className?: string
  onBeforeAdd?: (event: MouseEvent<HTMLButtonElement>) => void
  product: CartProductSnapshot
}

export function AddToCartButton({ className, onBeforeAdd, product }: AddToCartButtonProps) {
  const { addItem } = useCart()
  const isOutOfStock = product.stock < 1

  return (
    <button
      className={
        className ??
        'btn-press mt-3 flex w-full items-center justify-center gap-2 rounded-lg bg-brand-orange py-2.5 text-sm font-semibold text-white shadow-[0_12px_22px_rgba(240,97,25,0.18)] transition-all duration-200 hover:-translate-y-0.5 hover:brightness-105 hover:shadow-[0_16px_28px_rgba(240,97,25,0.24)] disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none'
      }
      disabled={isOutOfStock}
      onClick={(event) => {
        onBeforeAdd?.(event)
        addItem(product)
      }}
      type="button"
    >
      <svg aria-hidden="true" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <circle cx="9" cy="20" r="1.5" />
        <circle cx="18" cy="20" r="1.5" />
        <path d="M3 4h2l2.2 10.5a1 1 0 0 0 1 .8h8.9a1 1 0 0 0 1-.8L20 8H7" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      {isOutOfStock ? 'Sin stock' : 'Añadir al carrito'}
    </button>
  )
}
