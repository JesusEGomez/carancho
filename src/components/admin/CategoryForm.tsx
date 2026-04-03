'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm, type Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

import {
  AdminAlert,
  AdminField,
  AdminInput,
  AdminTextarea,
} from '@/components/admin/form-primitives'
import { useUpsertCategory } from '@/hooks/admin/useAdminCategories'
import type { MediaRecord } from '@/services/adminApi'

const MAX_IMAGE_SIZE_MB = 8
const MAX_IMAGE_SIZE_BYTES = MAX_IMAGE_SIZE_MB * 1024 * 1024

const categoryFormSchema = z
  .object({
    description: z.string().trim().optional(),
    featured: z.boolean().default(false),
    name: z.string().trim().min(2, 'El nombre debe tener al menos 2 caracteres'),
    showInNavigation: z.boolean().default(false),
  })

export type CategoryFormValues = z.infer<typeof categoryFormSchema>

export type CategoryFormData = CategoryFormValues & {
  heroImage?: MediaRecord | null
  heroImageId?: number | null
  id?: number
  parentId?: number | null
}

type CategoryFormProps = {
  initialData?: CategoryFormData
}

const defaultValues: CategoryFormData = {
  description: '',
  featured: false,
  heroImage: null,
  name: '',
  showInNavigation: false,
}

function validateHeroFile(file: File | null) {
  if (!file) {
    return null
  }

  if (!file.type.startsWith('image/')) {
    return 'Solo se permiten archivos de imagen'
  }

  if (file.size > MAX_IMAGE_SIZE_BYTES) {
    return `La imagen debe pesar menos de ${MAX_IMAGE_SIZE_MB}MB`
  }

  return null
}

export function CategoryForm({ initialData }: CategoryFormProps) {
  const router = useRouter()
  const upsertCategoryMutation = useUpsertCategory()
  const [heroFile, setHeroFile] = useState<File | null>(null)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const {
    formState: { errors },
    handleSubmit,
    register,
    reset,
  } = useForm<CategoryFormValues>({
    defaultValues: initialData ?? defaultValues,
    resolver: zodResolver(categoryFormSchema) as Resolver<CategoryFormValues>,
  })

  useEffect(() => {
    if (initialData) {
      reset(initialData)
      setHeroFile(null)
      setUploadError(null)
      return
    }

    reset(defaultValues)
  }, [initialData, reset])

  const isSubcategory = Boolean(initialData?.parentId)
  const title = initialData ? 'Editar categoría' : 'Nueva categoría'
  const error = upsertCategoryMutation.error?.message ?? uploadError

  return (
    <section className="surface-card max-w-4xl p-8">
      <div className="mb-8">
        <p className="text-xs font-bold uppercase tracking-[0.3em] text-brand-orange">Categorías</p>
        <h1 className="mt-2 text-3xl font-black text-brand-ink">{title}</h1>
      </div>

      <form
        className="grid gap-6"
        onSubmit={handleSubmit((values) => {
          const nextUploadError = validateHeroFile(heroFile)
          setUploadError(nextUploadError)

          if (nextUploadError) {
            return
          }

          void upsertCategoryMutation
            .mutateAsync({
              heroAlt: values.name,
              heroFile,
              id: initialData?.id ? String(initialData.id) : null,
              payload: {
                description: values.description?.trim() || null,
                featured: isSubcategory ? false : values.featured,
                heroImage: initialData?.heroImageId ?? null,
                name: values.name.trim(),
                parent: initialData?.parentId ?? null,
                showInNavigation: isSubcategory ? false : values.showInNavigation,
              },
            })
            .then(() => {
              router.push('/admin/categorias')
              router.refresh()
            })
        })}
      >
        <div className="grid gap-6 md:grid-cols-2">
          <AdminField error={errors.name?.message} label="Nombre" required>
            <AdminInput {...register('name')} />
          </AdminField>

          <AdminField error={errors.featured?.message} label="Destacar en home">
            <label className="flex items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3 font-medium text-brand-ink">
              <input disabled={isSubcategory} type="checkbox" {...register('featured')} />
              {isSubcategory ? 'Disponible solo para categorías principales' : 'Mostrar en el home'}
            </label>
          </AdminField>

          <AdminField error={errors.showInNavigation?.message} label="Mostrar en navegación">
            <label className="flex items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3 font-medium text-brand-ink">
              <input disabled={isSubcategory} type="checkbox" {...register('showInNavigation')} />
              {isSubcategory ? 'Disponible solo para categorías principales' : 'Mostrar en header y footer'}
            </label>
          </AdminField>

          <AdminField label="Imagen">
            <AdminInput
              accept="image/*"
              className="border-dashed border-slate-300 bg-slate-50 text-sm"
              onChange={(event) => {
                setHeroFile(event.target.files?.[0] ?? null)
                setUploadError(null)
              }}
              type="file"
            />
            {heroFile ? <span className="text-xs font-medium text-slate-500">Nueva imagen: {heroFile.name}</span> : null}
          </AdminField>
        </div>

        {initialData?.heroImage?.url && !heroFile ? (
          <div className="rounded-3xl border border-slate-200 p-5">
            <p className="text-sm font-black text-brand-ink">Imagen actual</p>
            <div className="mt-4 flex items-center gap-4">
              <img
                alt={initialData.heroImage.alt}
                className="h-20 w-20 rounded-2xl object-cover"
                src={initialData.heroImage.url}
              />
              <div className="text-sm text-slate-500">
                <p className="font-bold text-brand-ink">{initialData.heroImage.alt}</p>
                <p>Se conservará si no subís una nueva imagen.</p>
              </div>
            </div>
          </div>
        ) : null}

        <AdminField error={errors.description?.message} label="Descripción">
          <AdminTextarea className="min-h-32" {...register('description')} />
        </AdminField>

        {error ? <AdminAlert>{error}</AdminAlert> : null}

        <div className="flex flex-wrap items-center gap-3">
          <button
            className="rounded-full bg-brand-orange px-6 py-3 text-sm font-black uppercase tracking-wide text-white hover:bg-orange-600 disabled:opacity-60"
            disabled={upsertCategoryMutation.isPending}
            type="submit"
          >
            {upsertCategoryMutation.isPending ? 'Guardando...' : 'Guardar categoría'}
          </button>
          <button
            className="rounded-full border border-slate-200 px-6 py-3 text-sm font-black uppercase tracking-wide text-slate-500"
            onClick={() => {
              router.push('/admin/categorias')
            }}
            type="button"
          >
            Cancelar
          </button>
        </div>
      </form>
    </section>
  )
}
