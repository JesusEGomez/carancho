'use client'

import { createContext, useContext, useEffect, useMemo, useState } from 'react'

import type { CartLine, CartProductSnapshot } from '@/lib/cart'
import { useToast } from '@/providers/ToastProvider'

const STORAGE_KEY = 'carancho-store-cart'

type CartContextValue = {
  addItem: (product: CartProductSnapshot, quantity?: number) => void
  clearCart: (options?: { silent?: boolean }) => void
  itemCount: number
  items: CartLine[]
  removeItem: (productId: number) => void
  setQuantity: (productId: number, quantity: number) => void
  subtotal: number
}

const CartContext = createContext<CartContextValue | null>(null)

function clampQuantity(quantity: number, stock: number) {
  if (stock <= 0) {
    return 0
  }

  return Math.max(1, Math.min(quantity, stock))
}

function getAddItemResult(currentItems: CartLine[], product: CartProductSnapshot, quantity: number) {
  const existing = currentItems.find((item) => item.product.id === product.id)

  if (!existing) {
    const nextQuantity = clampQuantity(quantity, product.stock)

    return {
      nextItems: nextQuantity > 0 ? [...currentItems, { product, quantity: nextQuantity }] : currentItems,
      toast:
        nextQuantity > 0
          ? {
              message: `Agregaste ${nextQuantity} ${product.name} al carrito.`,
              tone: 'success' as const,
            }
          : null,
    }
  }

  const nextQuantity = clampQuantity(existing.quantity + quantity, product.stock)

  return {
    nextItems: currentItems.map((item) =>
      item.product.id === product.id
        ? {
            ...item,
            product,
            quantity: nextQuantity,
          }
        : item,
    ),
    toast: {
      message: `Actualizaste ${product.name} a ${nextQuantity} unidad${nextQuantity === 1 ? '' : 'es'}.`,
      tone: 'success' as const,
    },
  }
}

function getSetQuantityResult(currentItems: CartLine[], productId: number, quantity: number) {
  const item = currentItems.find((entry) => entry.product.id === productId)

  if (!item) {
    return {
      nextItems: currentItems,
      toast: null,
    }
  }

  const nextQuantity = clampQuantity(quantity, item.product.stock)

  if (nextQuantity > 0) {
    return {
      nextItems: currentItems.map((entry) => (entry.product.id === productId ? { ...entry, quantity: nextQuantity } : entry)),
      toast: {
        message: `${item.product.name}: ${nextQuantity} unidad${nextQuantity === 1 ? '' : 'es'}.`,
        tone: 'info' as const,
      },
    }
  }

  return {
    nextItems: currentItems.filter((entry) => entry.product.id !== productId),
    toast: {
      message: `${item.product.name} se quitó del carrito.`,
      tone: 'info' as const,
    },
  }
}

function getRemoveItemResult(currentItems: CartLine[], productId: number) {
  const item = currentItems.find((entry) => entry.product.id === productId)

  return {
    nextItems: currentItems.filter((entry) => entry.product.id !== productId),
    toast: item
      ? {
          message: `${item.product.name} se quitó del carrito.`,
          tone: 'info' as const,
        }
      : null,
  }
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { showToast } = useToast()
  const [items, setItems] = useState<CartLine[]>([])
  const [hasHydrated, setHasHydrated] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    try {
      const stored = window.localStorage.getItem(STORAGE_KEY)

      if (!stored) {
        return
      }

      const parsed = JSON.parse(stored) as CartLine[]
      setItems(Array.isArray(parsed) ? parsed : [])
    } catch {
      window.localStorage.removeItem(STORAGE_KEY)
    } finally {
      setHasHydrated(true)
    }
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined' || !hasHydrated) {
      return
    }

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  }, [hasHydrated, items])

  const value = useMemo<CartContextValue>(() => {
    const addItem = (product: CartProductSnapshot, quantity = 1) => {
      const result = getAddItemResult(items, product, quantity)
      setItems(result.nextItems)

      if (result.toast) {
        showToast(result.toast.message, result.toast.tone)
      }
    }

    const setQuantity = (productId: number, quantity: number) => {
      const result = getSetQuantityResult(items, productId, quantity)
      setItems(result.nextItems)

      if (result.toast) {
        showToast(result.toast.message, result.toast.tone)
      }
    }

    const removeItem = (productId: number) => {
      const result = getRemoveItemResult(items, productId)
      setItems(result.nextItems)

      if (result.toast) {
        showToast(result.toast.message, result.toast.tone)
      }
    }

    const clearCart = (options?: { silent?: boolean }) => {
      setItems([])

      if (!options?.silent) {
        showToast('El carrito quedó vacío.', 'info')
      }
    }

    const itemCount = items.reduce((sum, item) => sum + item.quantity, 0)
    const subtotal = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0)

    return {
      addItem,
      clearCart,
      itemCount,
      items,
      removeItem,
      setQuantity,
      subtotal,
    }
  }, [items, showToast])

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart() {
  const context = useContext(CartContext)

  if (!context) {
    throw new Error('useCart must be used within CartProvider')
  }

  return context
}
