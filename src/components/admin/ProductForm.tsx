'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useFieldArray, useForm, useWatch, type Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

import { useCategories, useUpsertProduct } from '@/hooks/useAdminCatalog'
import type { MediaRecord } from '@/services/adminApi'

const specificationSchema = z.object({
  label: z.string(),
  value: z.string(),
})

const featureSchema = z.object({
  label: z.string(),
})

const productFormSchema = z.object({
  badges: z.array(z.enum(['nuevo', 'oferta', 'destacado'])).default([]),
  categoryId: z.coerce.number().min(1, 'Selecciona una categoria'),
  compareAtPrice: z.union([z.literal(''), z.coerce.number().min(0)]).optional(),
  description: z.string().min(10, 'La descripcion es obligatoria'),
  features: z.array(featureSchema).default([]),
  isFeatured: z.boolean().default(true),
  name: z.string().min(3, 'El nombre es obligatorio'),
  price: z.coerce.number().min(0, 'Precio invalido'),
  shortDescription: z.string().min(10, 'La descripcion corta es obligatoria'),
  showFeatures: z.boolean().default(false),
  showSpecifications: z.boolean().default(false),
  slug: z.string().min(3, 'El slug es obligatorio'),
  specifications: z.array(specificationSchema).default([]),
  status: z.enum(['published', 'draft']),
  stock: z.coerce.number().min(0, 'Stock invalido'),
})

export type ProductFormValues = z.infer<typeof productFormSchema>

export type ProductFormData = ProductFormValues & {
  featuredImage?: MediaRecord | null
  featuredImageId?: number | null
  gallery?: MediaRecord[]
  id?: number
}

type ProductFormProps = {
  initialData?: ProductFormData
}

const emptyFeature = { label: '' }
const emptySpecification = { label: '', value: '' }

const defaultValues: ProductFormData = {
  badges: [],
  categoryId: 0,
  compareAtPrice: '',
  description: '',
  featuredImage: null,
  features: [],
  gallery: [],
  isFeatured: true,
  name: '',
  price: 0,
  shortDescription: '',
  showFeatures: false,
  showSpecifications: false,
  slug: '',
  specifications: [],
  status: 'published',
  stock: 0,
}

const filterFeatures = (features: ProductFormValues['features']) =>
  features
    .map((feature) => ({ label: feature.label.trim() }))
    .filter((feature) => feature.label.length > 0)

const filterSpecifications = (specifications: ProductFormValues['specifications']) =>
  specifications
    .map((specification) => ({
      label: specification.label.trim(),
      value: specification.value.trim(),
    }))
    .filter((specification) => specification.label.length > 0 && specification.value.length > 0)

export function ProductForm({ initialData }: ProductFormProps) {
  const router = useRouter()
  const categoriesQuery = useCategories()
  const upsertProductMutation = useUpsertProduct()
  const [featuredFile, setFeaturedFile] = useState<File | null>(null)
  const [galleryFiles, setGalleryFiles] = useState<File[]>([])
  const [existingGallery, setExistingGallery] = useState<MediaRecord[]>(initialData?.gallery ?? [])
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
      setExistingGallery(initialData.gallery ?? [])
      setFeaturedFile(null)
      setGalleryFiles([])
    }
  }, [initialData, reset])

  const categories = categoriesQuery.data?.docs ?? []
  const title = initialData ? 'Editar producto' : 'Nuevo producto'
  const error = categoriesQuery.error?.message ?? upsertProductMutation.error?.message ?? null
  const selectedBadges = useWatch({
    control,
    name: 'badges',
  }) ?? []
  const showFeatures = useWatch({
    control,
    name: 'showFeatures',
  })
  const showSpecifications = useWatch({
    control,
    name: 'showSpecifications',
  })

  const nextGalleryNames = useMemo(() => galleryFiles.map((file) => file.name), [galleryFiles])

  return (
    <section className="surface-card max-w-5xl p-8">
      <div className="mb-8">
        <p className="text-xs font-bold uppercase tracking-[0.3em] text-brand-orange">Inventario</p>
        <h1 className="mt-2 text-3xl font-black text-brand-ink">{title}</h1>
      </div>

      <form
        className="grid gap-6"
        onSubmit={handleSubmit((values) => {
          const nextFeatures = values.showFeatures ? filterFeatures(values.features) : []
          const nextSpecifications = values.showSpecifications ? filterSpecifications(values.specifications) : []

          void upsertProductMutation
            .mutateAsync({
              featuredAlt: values.name,
              featuredFile,
              galleryAlt: values.name,
              galleryExistingIds: existingGallery.map((image) => image.id),
              galleryFiles,
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
                features: nextFeatures,
                isFeatured: values.isFeatured,
                name: values.name,
                price: values.price,
                shortDescription: values.shortDescription,
                showFeatures: values.showFeatures && nextFeatures.length > 0,
                showSpecifications: values.showSpecifications && nextSpecifications.length > 0,
                slug: values.slug,
                specifications: nextSpecifications,
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
            {featuredFile ? <span className="text-xs font-medium text-slate-500">Nueva imagen: {featuredFile.name}</span> : null}
          </label>
        </div>

        {initialData?.featuredImage?.url && !featuredFile ? (
          <div className="rounded-3xl border border-slate-200 p-5">
            <p className="text-sm font-black text-brand-ink">Imagen principal actual</p>
            <div className="mt-4 flex items-center gap-4">
              <img
                alt={initialData.featuredImage.alt}
                className="h-20 w-20 rounded-2xl object-cover"
                src={initialData.featuredImage.url}
              />
              <div className="text-sm text-slate-500">
                <p className="font-bold text-brand-ink">{initialData.featuredImage.alt}</p>
                <p>Se conservará si no subís una nueva imagen.</p>
              </div>
            </div>
          </div>
        ) : null}

        <div className="rounded-3xl border border-slate-200 p-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-black text-brand-ink">Galería adicional</p>
              <p className="mt-1 text-sm text-slate-500">Podés subir varias imágenes extra para el detalle del producto.</p>
            </div>
          </div>

          <label className="mt-4 grid gap-2 text-sm font-bold text-brand-ink">
            Nuevas imágenes
            <input
              accept="image/*"
              className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-3 text-sm font-medium"
              multiple
              onChange={(event) => setGalleryFiles(Array.from(event.target.files ?? []))}
              type="file"
            />
          </label>

          {existingGallery.length ? (
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {existingGallery.map((image) => (
                <div key={image.id} className="rounded-2xl border border-slate-200 p-3">
                  {image.url ? <img alt={image.alt} className="h-28 w-full rounded-xl object-cover" src={image.url} /> : null}
                  <p className="mt-3 truncate text-sm font-bold text-brand-ink">{image.alt}</p>
                  <button
                    className="mt-3 text-sm font-black text-red-600"
                    onClick={() => setExistingGallery((current) => current.filter((item) => item.id !== image.id))}
                    type="button"
                  >
                    Quitar imagen
                  </button>
                </div>
              ))}
            </div>
          ) : null}

          {nextGalleryNames.length ? (
            <div className="mt-4 rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
              <p className="font-bold text-brand-ink">Nuevas imágenes a subir</p>
              <div className="mt-2 grid gap-1">
                {nextGalleryNames.map((name) => (
                  <span key={name}>{name}</span>
                ))}
              </div>
            </div>
          ) : null}
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
            <label className="flex items-center gap-3 text-sm font-black text-brand-ink">
              <input type="checkbox" {...register('showFeatures')} />
              Mostrar Características Generales
            </label>

            {showFeatures ? (
              <>
                <div className="mt-4 grid gap-3">
                  {featuresFieldArray.fields.length ? null : (
                    <p className="text-sm text-slate-500">Agregá las características que quieras mostrar en la ficha.</p>
                  )}
                  {featuresFieldArray.fields.map((field, index) => (
                    <div key={field.id} className="flex gap-3">
                      <input
                        className="w-full rounded-2xl border border-slate-200 px-4 py-3 font-medium outline-none focus:border-brand-orange"
                        placeholder="Ej: Mango ergonómico"
                        {...register(`features.${index}.label`)}
                      />
                      <button
                        className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-black text-slate-500"
                        onClick={() => featuresFieldArray.remove(index)}
                        type="button"
                      >
                        Quitar
                      </button>
                    </div>
                  ))}
                </div>
                <button
                  className="mt-4 text-sm font-black text-brand-orange"
                  onClick={() => featuresFieldArray.append(emptyFeature)}
                  type="button"
                >
                  + Agregar característica
                </button>
              </>
            ) : (
              <p className="mt-4 text-sm text-slate-500">La sección no se mostrará en el detalle del producto.</p>
            )}
          </div>

          <div className="rounded-3xl border border-slate-200 p-5">
            <label className="flex items-center gap-3 text-sm font-black text-brand-ink">
              <input type="checkbox" {...register('showSpecifications')} />
              Mostrar Especificaciones Técnicas
            </label>

            {showSpecifications ? (
              <>
                <div className="mt-4 grid gap-3">
                  {specificationsFieldArray.fields.length ? null : (
                    <p className="text-sm text-slate-500">Agregá pares de título y valor según el producto.</p>
                  )}
                  {specificationsFieldArray.fields.map((field, index) => (
                    <div key={field.id} className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
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
                      <button
                        className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-black text-slate-500"
                        onClick={() => specificationsFieldArray.remove(index)}
                        type="button"
                      >
                        Quitar
                      </button>
                    </div>
                  ))}
                </div>
                <button
                  className="mt-4 text-sm font-black text-brand-orange"
                  onClick={() => specificationsFieldArray.append(emptySpecification)}
                  type="button"
                >
                  + Agregar especificación
                </button>
              </>
            ) : (
              <p className="mt-4 text-sm text-slate-500">La sección no se mostrará en el detalle del producto.</p>
            )}
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
