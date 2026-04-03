'use client'

import { use } from 'react'

import { CategoryForm, type CategoryFormData } from '@/components/admin/CategoryForm'
import { useCategory } from '@/hooks/admin/useAdminCategories'
import type { CategoryOption, MediaRecord } from '@/services/adminApi'

type Props = {
  params: Promise<{
    id: string
  }>
}

function mediaRelation(value: CategoryOption | MediaRecord | number | null | undefined) {
  if (typeof value === 'object' && value !== null && 'alt' in value) {
    return value
  }

  return null
}

function categoryRelation(value: CategoryOption | MediaRecord | number | null | undefined) {
  if (typeof value === 'object' && value !== null && 'slug' in value) {
    return value
  }

  return null
}

export default function EditCategoryPage({ params }: Props) {
  const { id } = use(params)
  const categoryQuery = useCategory(id)
  const category = categoryQuery.data
  const error = categoryQuery.error?.message ?? null

  if (error) {
    return <div className="rounded-3xl bg-red-50 p-6 text-sm font-bold text-red-600">{error}</div>
  }

  if (!category) {
    return <div className="rounded-3xl bg-white p-6 text-sm font-bold text-slate-500">Cargando categoría...</div>
  }

  const heroImage = mediaRelation(category.heroImage)
  const parent = categoryRelation(category.parent)

  const initialData: CategoryFormData = {
    description: category.description ?? '',
    featured: category.featured ?? false,
    heroImage,
    heroImageId: heroImage?.id ?? (typeof category.heroImage === 'number' ? category.heroImage : null),
    id: category.id,
    name: category.name,
    parentId: parent?.id ?? (typeof category.parent === 'number' ? category.parent : null),
    showInNavigation: category.showInNavigation ?? false,
  }

  return <CategoryForm initialData={initialData} />
}
