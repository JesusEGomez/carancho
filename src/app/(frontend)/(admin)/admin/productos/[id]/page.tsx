'use client'

import { use } from 'react'

import { ProductForm, type ProductFormData } from '@/components/admin/ProductForm'
import { useProduct } from '@/hooks/useAdminCatalog'
import type { MediaRecord } from '@/services/adminApi'

type Props = {
  params: Promise<{
    id: string
  }>
}

export default function EditProductPage({ params }: Props) {
  const { id } = use(params)
  const productQuery = useProduct(id)
  const product = productQuery.data
  const error = productQuery.error?.message ?? null

  if (error) {
    return <div className="rounded-3xl bg-red-50 p-6 text-sm font-bold text-red-600">{error}</div>
  }

  if (!product) {
    return <div className="rounded-3xl bg-white p-6 text-sm font-bold text-slate-500">Cargando producto...</div>
  }

  const features = product.features?.filter((feature) => feature.label.trim().length > 0) ?? []
  const specifications =
    product.specifications?.filter(
      (item) => item.label.trim().length > 0 && item.value.trim().length > 0,
    ) ?? []
  const gallery = (product.gallery ?? []).filter((image): image is MediaRecord => typeof image === 'object' && image !== null)
  const featuredImage = typeof product.featuredImage === 'object' && product.featuredImage ? product.featuredImage : null

  const initialData: ProductFormData = {
    badges: product.badges ?? [],
    categoryId: typeof product.category === 'object' ? product.category.id : product.category,
    compareAtPrice: product.compareAtPrice ?? '',
    description: product.description,
    featuredImage,
    featuredImageId: featuredImage?.id ?? (typeof product.featuredImage === 'number' ? product.featuredImage : null),
    features: features.map((feature) => ({ label: feature.label })),
    gallery,
    id: product.id,
    isFeatured: product.isFeatured,
    name: product.name,
    price: product.price,
    shortDescription: product.shortDescription,
    showFeatures: product.showFeatures ?? features.length > 0,
    showSpecifications: product.showSpecifications ?? specifications.length > 0,
    slug: product.slug,
    specifications: specifications.map((item) => ({ label: item.label, value: item.value })),
    status: product.status,
    stock: product.stock,
  }

  return <ProductForm initialData={initialData} />
}
