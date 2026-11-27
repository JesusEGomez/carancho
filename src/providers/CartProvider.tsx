'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useSyncExternalStore } from 'react'

import { useIsHydrated } from '@/hooks/store/useIsHydrated'
import { applyFreshPrices, getCartTotals, type CartLine, type CartProductSnapshot } from '@/lib/cart'
import { fetchProductPrices } from '@/services/store/productPricesApi'
import type { PaymentMethod } from '@/lib/pricing'
import { useToast } from '@/providers/ToastProvider'

const STORAGE_KEY = 'carancho-store-cart'

type CartContextValue = {
  addItem: (product: CartProductSnapshot, quantity?: number) => void
  clearCart: (options?: { silent?: boolean }) => void
  hasHydrated: boolean
  itemCount: number
  items: CartLine[]
  refreshPrices: (productIds: number[]) => Promise<void>
  removeItem: (productId: number) => void
  setQuantity: (productId: number, quantity: number) => void
  /** Cash subtotal. */
  subtotal: number
  totals: Record<PaymentMethod, number>
}

const CartContext = createContext<CartContextValue | null>(null)

// The cart lives in localStorage, which React reads as an external store.
const EMPTY_CART: CartLine[] = []
const cartListeners = new Set<() => void>()
let cachedRawCart: string | null = null
let cachedCart: CartLine[] = EMPTY_CART

function parseCart(raw: string | null): CartLine[] {
  if (!raw) {
    return EMPTY_CART
  }

  try {
    const parsed = JSON.parse(raw) as unknown
    return Array.isArray(parsed) ? (parsed as CartLine[]) : EMPTY_CART
  } catch {
    return EMPTY_CART
  }
}

/** Returns a stable reference until the stored cart string changes, as useSyncExternalStore requires. */
function getCartSnapshot(): CartLine[] {
  let raw: string | null

  try {
    raw = window.localStorage.getItem(STORAGE_KEY)
  } catch {
    return cachedCart
  }

  if (raw !== cachedRawCart) {
    cachedRawCart = raw
    cachedCart = parseCart(raw)
  }

  return cachedCart
}

function getServerCartSnapshot(): CartLine[] {
  return EMPTY_CART
}

function subscribeToCart(listener: () => void) {
  cartListeners.add(listener)

  const handleStorage = (event: StorageEvent) => {
    if (event.key === null || event.key === STORAGE_KEY) {
      listener()
    }
  }

  window.addEventListener('storage', handleStorage)

  return () => {
    cartListeners.delete(listener)
    window.removeEventListener('storage', handleStorage)
  }
}

function writeCart(nextItems: CartLine[]) {
  const raw = JSON.stringify(nextItems)

  try {
    window.localStorage.setItem(STORAGE_KEY, raw)
  } catch {
    // Storage unavailable or full: keep the cart in memory for this session.
  }

  cachedRawCart = raw
  cachedCart = nextItems
  cartListeners.forEach((listener) => listener())
}

function updateCart(updater: (currentItems: CartLine[]) => CartLine[]) {
  writeCart(updater(getCartSnapshot()))
}

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
  // The server snapshot (empty cart) is used while hydrating, so the first client render matches the server.
  const items = useSyncExternalStore(subscribeToCart, getCartSnapshot, getServerCartSnapshot)
  const hasHydrated = useIsHydrated()

  const refreshPrices = useCallback(async (productIds: number[]) => {
    try {
      const fresh = await fetchProductPrices(productIds)
      updateCart((current) => applyFreshPrices(current, fresh))
    } catch (error) {
      // Display-only refresh: the server prices every order from the database anyway.
      console.warn('Could not refresh cart prices', error)
    }
  }, [])

  const value = useMemo<CartContextValue>(() => {
    const addItem = (product: CartProductSnapshot, quantity = 1) => {
      const result = getAddItemResult(items, product, quantity)
      writeCart(result.nextItems)

      if (result.toast) {
        showToast(result.toast.message, result.toast.tone)
      }
    }

    const setQuantity = (productId: number, quantity: number) => {
      const result = getSetQuantityResult(items, productId, quantity)
      writeCart(result.nextItems)

      if (result.toast) {
        showToast(result.toast.message, result.toast.tone)
      }
    }

    const removeItem = (productId: number) => {
      const result = getRemoveItemResult(items, productId)
      writeCart(result.nextItems)

      if (result.toast) {
        showToast(result.toast.message, result.toast.tone)
      }
    }

    const clearCart = (options?: { silent?: boolean }) => {
      writeCart(EMPTY_CART)

      if (!options?.silent) {
        showToast('El carrito quedó vacío.', 'info')
      }
    }

    const itemCount = items.reduce((sum, item) => sum + item.quantity, 0)
    const totals = getCartTotals(items)
    const subtotal = totals.cash

    return {
      addItem,
      clearCart,
      hasHydrated,
      itemCount,
      items,
      refreshPrices,
      removeItem,
      setQuantity,
      subtotal,
      totals,
    }
  }, [hasHydrated, items, refreshPrices, showToast])

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart() {
  const context = useContext(CartContext)

  if (!context) {
    throw new Error('useCart must be used within CartProvider')
  }

  return context
}

/** Refreshes the cart's price snapshots from the server whenever the set of products changes. */
export function useRefreshCartPrices() {
  const { hasHydrated, items, refreshPrices } = useCart()
  const productIdsKey = items
    .map((item) => item.product.id)
    .sort((a, b) => a - b)
    .join(',')

  useEffect(() => {
    if (!hasHydrated || !productIdsKey) {
      return
    }

    void refreshPrices(productIdsKey.split(',').map(Number))
  }, [hasHydrated, productIdsKey, refreshPrices])
}
