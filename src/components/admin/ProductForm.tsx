'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useFieldArray, useForm, useWatch, type Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

import { useCategories, useUpsertProduct } from '@/hooks/useAdminCatalog'

const specificationSchema = z.object({
  label: z.string().min(1, 'Campo requerido'),
  value: z.string().min(1, 'Campo requerido'),
})

const productFormSchema = z.object({
  badges: z.array(z.enum(['nuevo', 'oferta', 'destacado'])).default([]),
  categoryId: z.coerce.number().min(1, 'Selecciona una categoria'),
  compareAtPrice: z.union([z.literal(''), z.coerce.number().min(0)]).optional(),
  description: z.string().min(10, 'La descripcion es obligatoria'),
  features: z.array(z.object({ label: z.string().min(1, 'Campo requerido') })).min(1),
  isFeatured: z.boolean().default(true),
  name: z.string().min(3, 'El nombre es obligatorio'),
  price: z.coerce.number().min(0, 'Precio invalido'),
  shortDescription: z.string().min(10, 'La descripcion corta es obligatoria'),
  slug: z.string().min(3, 'El slug es obligatorio'),
  specifications: z.array(specificationSchema).min(1),
  status: z.enum(['published', 'draft']),
  stock: z.coerce.number().min(0, 'Stock invalido'),
})

export type ProductFormValues = z.infer<typeof productFormSchema>

export type ProductFormData = ProductFormValues & {
  featuredImageId?: number | null
  id?: number
}

type ProductFormProps = {
  initialData?: ProductFormData
}

const defaultValues: ProductFormData = {
  badges: [],
  categoryId: 0,
  compareAtPrice: '',
  description: '',
  features: [{ label: '' }],
  isFeatured: true,
  name: '',
  price: 0,
  shortDescription: '',
  slug: '',
  specifications: [{ label: '', value: '' }],
  status: 'published',
  stock: 0,
}

export function ProductForm({ initialData }: ProductFormProps) {
  const router = useRouter()
  const categoriesQuery = useCategories()
  const upsertProductMutation = useUpsertProduct()
  const [featuredFile, setFeaturedFile] = useState<File | null>(null)
  const {
    control,
    formState: { errors },
    handleSubmit,
    register,
    reset,
    setValue,
  } = useForm<ProductFormValues>({
    defaultValues: initialData ?? defaultValues,
    resolver: zodResolver(productFormSchema) as Resolver<ProductFormValues>,
  })

  const featuresFieldArray = useFieldArray({
    control,
    name: 'features',
  })

  const specificationsFieldArray = useFieldArray({
    control,
    name: 'specifications',
  })

  useEffect(() => {
    if (initialData) {
      reset(initialData)
    }
  }, [initialData, reset])

  const categories = categoriesQuery.data?.docs ?? []
  const title = initialData ? 'Editar producto' : 'Nuevo producto'
  const error = categoriesQuery.error?.message ?? upsertProductMutation.error?.message ?? null
  const selectedBadges = useWatch({
    control,
    name: 'badges',
  }) ?? []

  return (
    <section className="surface-card max-w-5xl p-8">
      <div className="mb-8">
        <p className="text-xs font-bold uppercase tracking-[0.3em] text-brand-orange">Inventario</p>
        <h1 className="mt-2 text-3xl font-black text-brand-ink">{title}</h1>
      </div>

      <form
        className="grid gap-6"
        onSubmit={handleSubmit((values) => {
          void upsertProductMutation
            .mutateAsync({
              featuredAlt: values.name,
              featuredFile,
              id: initialData?.id ? String(initialData.id) : null,
              payload: {
                badges: values.badges,
                category: values.categoryId,
                compareAtPrice:
                  values.compareAtPrice === '' || values.compareAtPrice === undefined
                    ? null
                    : Number(values.compareAtPrice),
                description: values.description,
                featuredImage: initialData?.featuredImageId ?? null,
                features: values.features,
                isFeatured: values.isFeatured,
                name: values.name,
                price: values.price,
                shortDescription: values.shortDescription,
                slug: values.slug,
                specifications: values.specifications,
                status: values.status,
                stock: values.stock,
              },
            })
            .then(() => {
              router.push('/admin/productos')
              router.refresh()
            })
        })}
      >
        <div className="grid gap-6 md:grid-cols-2">
          <label className="grid gap-2 text-sm font-bold text-brand-ink">
            Nombre
            <input
              className="rounded-2xl border border-slate-200 px-4 py-3 font-medium outline-none focus:border-brand-orange"
              {...register('name')}
            />
            {errors.name ? <span className="text-xs font-semibold text-red-600">{errors.name.message}</span> : null}
          </label>

          <label className="grid gap-2 text-sm font-bold text-brand-ink">
            Slug
            <input
              className="rounded-2xl border border-slate-200 px-4 py-3 font-medium outline-none focus:border-brand-orange"
              {...register('slug')}
            />
            {errors.slug ? <span className="text-xs font-semibold text-red-600">{errors.slug.message}</span> : null}
          </label>

          <label className="grid gap-2 text-sm font-bold text-brand-ink">
            Categoria
            <select
              className="rounded-2xl border border-slate-200 px-4 py-3 font-medium outline-none focus:border-brand-orange"
              {...register('categoryId')}
            >
              <option value={0}>Seleccionar categoria</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
            {errors.categoryId ? <span className="text-xs font-semibold text-red-600">{errors.categoryId.message}</span> : null}
          </label>

          <label className="grid gap-2 text-sm font-bold text-brand-ink">
            Estado
            <select
              className="rounded-2xl border border-slate-200 px-4 py-3 font-medium outline-none focus:border-brand-orange"
              {...register('status')}
            >
              <option value="published">Publicado</option>
              <option value="draft">Borrador</option>
            </select>
          </label>

          <label className="grid gap-2 text-sm font-bold text-brand-ink">
            Precio
            <input
              className="rounded-2xl border border-slate-200 px-4 py-3 font-medium outline-none focus:border-brand-orange"
              min={0}
              type="number"
              {...register('price')}
            />
          </label>

          <label className="grid gap-2 text-sm font-bold text-brand-ink">
            Precio comparado
            <input
              className="rounded-2xl border border-slate-200 px-4 py-3 font-medium outline-none focus:border-brand-orange"
              min={0}
              type="number"
              {...register('compareAtPrice')}
            />
          </label>

          <label className="grid gap-2 text-sm font-bold text-brand-ink">
            Stock
            <input
              className="rounded-2xl border border-slate-200 px-4 py-3 font-medium outline-none focus:border-brand-orange"
              min={0}
              type="number"
              {...register('stock')}
            />
          </label>

          <label className="grid gap-2 text-sm font-bold text-brand-ink">
            Imagen principal
            <input
              accept="image/*"
              className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-3 text-sm font-medium"
              onChange={(event) => setFeaturedFile(event.target.files?.[0] ?? null)}
              type="file"
            />
          </label>
        </div>

        <label className="grid gap-2 text-sm font-bold text-brand-ink">
          Descripcion corta
          <textarea
            className="min-h-28 rounded-3xl border border-slate-200 px-4 py-3 font-medium outline-none focus:border-brand-orange"
            {...register('shortDescription')}
          />
          {errors.shortDescription ? (
            <span className="text-xs font-semibold text-red-600">{errors.shortDescription.message}</span>
          ) : null}
        </label>

        <label className="grid gap-2 text-sm font-bold text-brand-ink">
          Descripcion
          <textarea
            className="min-h-40 rounded-3xl border border-slate-200 px-4 py-3 font-medium outline-none focus:border-brand-orange"
            {...register('description')}
          />
          {errors.description ? <span className="text-xs font-semibold text-red-600">{errors.description.message}</span> : null}
        </label>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-3xl border border-slate-200 p-5">
            <p className="text-sm font-black text-brand-ink">Features</p>
            <div className="mt-4 grid gap-3">
              {featuresFieldArray.fields.map((field, index) => (
                <div key={field.id}>
                  <input
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 font-medium outline-none focus:border-brand-orange"
                    {...register(`features.${index}.label`)}
                  />
                </div>
              ))}
            </div>
            <button
              className="mt-4 text-sm font-black text-brand-orange"
              onClick={() => featuresFieldArray.append({ label: '' })}
              type="button"
            >
              + Agregar feature
            </button>
          </div>

          <div className="rounded-3xl border border-slate-200 p-5">
            <p className="text-sm font-black text-brand-ink">Especificaciones</p>
            <div className="mt-4 grid gap-3">
              {specificationsFieldArray.fields.map((field, index) => (
                <div key={field.id} className="grid gap-3 sm:grid-cols-2">
                  <input
                    className="rounded-2xl border border-slate-200 px-4 py-3 font-medium outline-none focus:border-brand-orange"
                    placeholder="Largo"
                    {...register(`specifications.${index}.label`)}
                  />
                  <input
                    className="rounded-2xl border border-slate-200 px-4 py-3 font-medium outline-none focus:border-brand-orange"
                    placeholder="2.10 metros"
                    {...register(`specifications.${index}.value`)}
                  />
                </div>
              ))}
            </div>
            <button
              className="mt-4 text-sm font-black text-brand-orange"
              onClick={() => specificationsFieldArray.append({ label: '', value: '' })}
              type="button"
            >
              + Agregar especificacion
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-bold text-brand-ink">
            <input type="checkbox" {...register('isFeatured')} />
            Destacado
          </label>
          {(['nuevo', 'oferta', 'destacado'] as const).map((badge) => (
            <label
              key={badge}
              className="flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-bold capitalize text-brand-ink"
            >
              <input
                checked={selectedBadges.includes(badge)}
                onChange={(event) => {
                  const next = event.target.checked
                    ? [...selectedBadges, badge]
                    : selectedBadges.filter((currentBadge) => currentBadge !== badge)
                  setValue('badges', next, { shouldDirty: true, shouldValidate: true })
                }}
                type="checkbox"
              />
              {badge}
            </label>
          ))}
        </div>

        {error ? <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm font-bold text-red-600">{error}</p> : null}

        <div className="flex flex-wrap items-center gap-3">
          <button
            className="rounded-full bg-brand-orange px-6 py-3 text-sm font-black uppercase tracking-wide text-white hover:bg-orange-600 disabled:opacity-60"
            disabled={upsertProductMutation.isPending}
            type="submit"
          >
            {upsertProductMutation.isPending ? 'Guardando...' : 'Guardar producto'}
          </button>
          <button
            className="rounded-full border border-slate-200 px-6 py-3 text-sm font-black uppercase tracking-wide text-slate-500"
            onClick={() => router.push('/admin/productos')}
            type="button"
          >
            Cancelar
          </button>
        </div>
      </form>
    </section>
  )
}
