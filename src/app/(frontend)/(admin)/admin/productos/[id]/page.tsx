'use client'

import { use } from 'react'

import { ProductForm, type ProductFormData } from '@/components/admin/ProductForm'
import { useProduct } from '@/hooks/useAdminCatalog'

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

  const initialData: ProductFormData = {
    badges: product.badges ?? [],
    categoryId: typeof product.category === 'object' ? product.category.id : 0,
    compareAtPrice: product.compareAtPrice ?? '',
    description: product.description,
    featuredImageId: typeof product.featuredImage === 'object' && product.featuredImage ? product.featuredImage.id : null,
    features: product.features?.map((feature) => ({ label: feature.label })) ?? [{ label: '' }],
    id: product.id,
    isFeatured: product.isFeatured,
    name: product.name,
    price: product.price,
    shortDescription: product.shortDescription,
    slug: product.slug,
    specifications: product.specifications?.map((item) => ({ label: item.label, value: item.value })) ?? [
      { label: '', value: '' },
    ],
    status: product.status,
    stock: product.stock,
  }

  return <ProductForm initialData={initialData} />
}
