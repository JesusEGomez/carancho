export type CartProductSnapshot = {
  featuredImageAlt?: string | null
  featuredImageUrl?: string | null
  id: number
  name: string
  price: number
  slug: string
  stock: number
}

export type CartLine = {
  product: CartProductSnapshot
  quantity: number
}
