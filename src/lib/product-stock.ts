export type ProductStockPresentation = {
  badgeClassName: string
  helperText: string
  isLowStock: boolean
  isOutOfStock: boolean
  label: string
}

export function getProductStockPresentation(stock: number): ProductStockPresentation {
  const isOutOfStock = stock < 1
  const isLowStock = stock > 0 && stock <= 5

  if (isOutOfStock) {
    return {
      badgeClassName: 'bg-red-50 text-red-600',
      helperText: 'Este producto está agotado por el momento.',
      isLowStock,
      isOutOfStock,
      label: 'Sin stock disponible',
    }
  }

  if (isLowStock) {
    return {
      badgeClassName: 'bg-amber-50 text-amber-700',
      helperText: 'Quedan pocas unidades disponibles. Te recomendamos confirmar la compra pronto.',
      isLowStock,
      isOutOfStock,
      label: `Últimas ${stock} unidades`,
    }
  }

  return {
    badgeClassName: 'bg-emerald-50 text-emerald-600',
    helperText: 'Stock actualizado en tiempo real para que compres con disponibilidad visible.',
    isLowStock,
    isOutOfStock,
    label: `${stock} unidades disponibles`,
  }
}
