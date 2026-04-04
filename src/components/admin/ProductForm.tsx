'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useFieldArray, useForm, useWatch, type FieldErrors, type Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

import {
  AdminAlert,
  AdminField,
  AdminFieldError,
  AdminInput,
  AdminSelect,
  AdminTextarea,
} from '@/components/admin/form-primitives'
import { useCategories } from '@/hooks/admin/useAdminCategories'
import { useUpsertProduct } from '@/hooks/admin/useAdminProducts'
import type { MediaRecord } from '@/services/adminApi'

const MAX_IMAGE_SIZE_MB = 8
const MAX_IMAGE_SIZE_BYTES = MAX_IMAGE_SIZE_MB * 1024 * 1024
const MAX_GALLERY_IMAGES = 8

const featureSchema = z.object({
  label: z.string().trim().min(1, 'La característica no puede estar vacía'),
})

const specificationSchema = z.object({
  label: z.string().trim().min(1, 'El título es obligatorio'),
  value: z.string().trim().min(1, 'El valor es obligatorio'),
})

const productFormSchema = z
  .object({
    badges: z.array(z.enum(['nuevo', 'oferta', 'destacado'])).default([]),
    compareAtPrice: z.union([z.literal(''), z.coerce.number().min(0, 'El precio comparado debe ser positivo')]),
    description: z.string().trim().min(10, 'La descripción debe tener al menos 10 caracteres'),
    features: z.array(featureSchema).default([]),
    isFeatured: z.boolean().default(false),
    name: z.string().trim().min(3, 'El nombre debe tener al menos 3 caracteres'),
    parentCategoryId: z.coerce.number().min(1, 'Selecciona una categoría'),
    price: z.coerce.number().min(0, 'El precio debe ser mayor o igual a 0'),
    shortDescription: z.string().trim().min(10, 'La descripción corta debe tener al menos 10 caracteres'),
    showFeatures: z.boolean().default(false),
    showSpecifications: z.boolean().default(false),
    specifications: z.array(specificationSchema).default([]),
    status: z.enum(['published', 'draft']),
    stock: z.coerce.number().min(0, 'El stock debe ser mayor o igual a 0'),
    subcategoryId: z.coerce.number().min(1, 'Selecciona una subcategoría'),
  })
  .superRefine((values, context) => {
    if (values.compareAtPrice !== '' && Number(values.compareAtPrice) < values.price) {
      context.addIssue({
        code: 'custom',
        message: 'El precio comparado no puede ser menor al precio actual',
        path: ['compareAtPrice'],
      })
    }

    if (values.showFeatures && values.features.length === 0) {
      context.addIssue({
        code: 'custom',
        message: 'Agrega al menos una característica para mostrar esta sección',
        path: ['features'],
      })
    }

    if (values.showSpecifications && values.specifications.length === 0) {
      context.addIssue({
        code: 'custom',
        message: 'Agrega al menos una especificación para mostrar esta sección',
        path: ['specifications'],
      })
    }
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

type UploadErrors = {
  featuredImage?: string
  gallery?: string
}

const emptyFeature = { label: '' }
const emptySpecification = { label: '', value: '' }

const defaultValues: ProductFormData = {
  badges: [],
  compareAtPrice: '',
  description: '',
  featuredImage: null,
  features: [],
  gallery: [],
  isFeatured: true,
  name: '',
  parentCategoryId: 0,
  price: 0,
  shortDescription: '',
  showFeatures: false,
  showSpecifications: false,
  specifications: [],
  status: 'published',
  stock: 0,
  subcategoryId: 0,
}

function getFieldArrayError<TFieldName extends 'features' | 'specifications'>(
  errors: FieldErrors<ProductFormValues>,
  fieldName: TFieldName,
) {
  const fieldError = errors[fieldName]

  return fieldError && 'message' in fieldError && typeof fieldError.message === 'string'
    ? fieldError.message
    : undefined
}

function validateImageFile(file: File) {
  if (!file.type.startsWith('image/')) {
    return 'Solo se permiten archivos de imagen'
  }

  if (file.size > MAX_IMAGE_SIZE_BYTES) {
    return `Cada imagen debe pesar menos de ${MAX_IMAGE_SIZE_MB}MB`
  }

  return null
}

function validateUploads({
  existingFeaturedImage,
  existingGalleryCount,
  featuredFile,
  galleryFiles,
}: {
  existingFeaturedImage: MediaRecord | null | undefined
  existingGalleryCount: number
  featuredFile: File | null
  galleryFiles: File[]
}) {
  const errors: UploadErrors = {}

  if (!existingFeaturedImage && !featuredFile) {
    errors.featuredImage = 'La imagen principal es obligatoria'
  }

  if (featuredFile) {
    const featuredError = validateImageFile(featuredFile)

    if (featuredError) {
      errors.featuredImage = featuredError
    }
  }

  if (existingGalleryCount + galleryFiles.length > MAX_GALLERY_IMAGES) {
    errors.gallery = `La galería admite hasta ${MAX_GALLERY_IMAGES} imágenes`
  } else {
    const invalidGalleryFile = galleryFiles.map(validateImageFile).find(Boolean)

    if (invalidGalleryFile) {
      errors.gallery = invalidGalleryFile
    }
  }

  return errors
}

export function ProductForm({ initialData }: ProductFormProps) {
  const router = useRouter()
  const categoriesQuery = useCategories()
  const upsertProductMutation = useUpsertProduct()
  const [featuredFile, setFeaturedFile] = useState<File | null>(null)
  const [galleryFiles, setGalleryFiles] = useState<File[]>([])
  const [existingGallery, setExistingGallery] = useState<MediaRecord[]>(initialData?.gallery ?? [])
  const [uploadErrors, setUploadErrors] = useState<UploadErrors>({})
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
      setUploadErrors({})
    }
  }, [initialData, reset])

  const categories = categoriesQuery.data?.docs ?? []
  const parentCategories = useMemo(
    () => categories.filter((category) => !category.parent),
    [categories],
  )
  const title = initialData ? 'Editar producto' : 'Nuevo producto'
  const error = categoriesQuery.error?.message ?? upsertProductMutation.error?.message ?? null
  const selectedBadges = useWatch({
    control,
    name: 'badges',
  }) ?? []
  const selectedParentCategoryId = useWatch({
    control,
    name: 'parentCategoryId',
  })
  const selectedSubcategoryId = useWatch({
    control,
    name: 'subcategoryId',
  })
  const showFeatures = useWatch({
    control,
    name: 'showFeatures',
  })
  const showSpecifications = useWatch({
    control,
    name: 'showSpecifications',
  })
  const availableSubcategories = useMemo(
    () =>
      categories.filter((category) => {
        const parentId =
          typeof category.parent === 'number'
            ? category.parent
            : category.parent && typeof category.parent === 'object'
              ? category.parent.id
              : null

        return parentId === selectedParentCategoryId
      }),
    [categories, selectedParentCategoryId],
  )
  const selectedParentCategory = parentCategories.find((category) => category.id === selectedParentCategoryId)

  const nextGalleryNames = useMemo(() => galleryFiles.map((file) => file.name), [galleryFiles])
  const featuresError = getFieldArrayError(errors, 'features')
  const specificationsError = getFieldArrayError(errors, 'specifications')

  return (
    <section className="surface-card max-w-5xl p-8">
      <div className="mb-8">
        <p className="text-xs font-bold uppercase tracking-[0.3em] text-brand-orange">Inventario</p>
        <h1 className="mt-2 text-3xl font-black text-brand-ink">{title}</h1>
      </div>

      <form
        className="grid gap-6"
        onSubmit={handleSubmit((values) => {
          const nextUploadErrors = validateUploads({
            existingFeaturedImage: initialData?.featuredImage,
            existingGalleryCount: existingGallery.length,
            featuredFile,
            galleryFiles,
          })

          setUploadErrors(nextUploadErrors)

          if (Object.keys(nextUploadErrors).length > 0) {
            return
          }

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
                category: values.subcategoryId,
                compareAtPrice:
                  values.compareAtPrice === '' || values.compareAtPrice === undefined
                    ? null
                    : Number(values.compareAtPrice),
                description: values.description.trim(),
                featuredImage: initialData?.featuredImageId ?? null,
                features: values.showFeatures ? values.features.map((feature) => ({ label: feature.label.trim() })) : [],
                isFeatured: values.isFeatured,
                name: values.name.trim(),
                price: values.price,
                shortDescription: values.shortDescription.trim(),
                showFeatures: values.showFeatures,
                showSpecifications: values.showSpecifications,
                specifications: values.showSpecifications
                  ? values.specifications.map((item) => ({
                      label: item.label.trim(),
                      value: item.value.trim(),
                    }))
                  : [],
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
          <AdminField error={errors.name?.message} label="Nombre" required>
            <AdminInput {...register('name')} />
          </AdminField>

          <AdminField error={errors.parentCategoryId?.message} label="Categoría" required>
            <AdminSelect
              {...register('parentCategoryId')}
              onChange={(event) => {
                const value = Number(event.target.value)
                setValue('parentCategoryId', value, { shouldDirty: true, shouldValidate: true })
                setValue('subcategoryId', 0, { shouldDirty: true, shouldValidate: true })
              }}
              value={selectedParentCategoryId}
            >
              <option value={0}>Seleccionar categoría</option>
              {parentCategories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </AdminSelect>
          </AdminField>

          <div className="grid gap-2">
            <AdminField error={errors.subcategoryId?.message} label="Subcategoría" required>
              <AdminSelect
                {...register('subcategoryId')}
                disabled={!selectedParentCategoryId}
                value={selectedSubcategoryId}
              >
                <option value={0}>
                  {selectedParentCategoryId ? 'Seleccionar subcategoría' : 'Primero elegí una categoría'}
                </option>
                {availableSubcategories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </AdminSelect>
            </AdminField>
            <div className="flex items-center justify-between gap-3 rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-3">
              <div className="text-xs text-slate-500">
                {selectedParentCategoryId
                  ? availableSubcategories.length
                    ? `Subcategorías disponibles para ${selectedParentCategory?.name}.`
                    : `Todavía no hay subcategorías para ${selectedParentCategory?.name}. Creala desde Categorías.`
                  : 'Elegí una categoría para ver sus subcategorías disponibles.'}
              </div>
            </div>
          </div>

          <AdminField label="Estado" required>
            <AdminSelect {...register('status')}>
              <option value="published">Publicado</option>
              <option value="draft">Borrador</option>
            </AdminSelect>
          </AdminField>

          <AdminField error={errors.price?.message} label="Precio" required>
            <AdminInput min={0} type="number" {...register('price')} />
          </AdminField>

          <AdminField error={errors.compareAtPrice?.message} label="Precio comparado">
            <AdminInput min={0} type="number" {...register('compareAtPrice')} />
          </AdminField>

          <AdminField error={errors.stock?.message} label="Stock" required>
            <AdminInput min={0} type="number" {...register('stock')} />
          </AdminField>

          <AdminField error={uploadErrors.featuredImage} label="Imagen principal" required>
            <AdminInput
              accept="image/*"
              className="border-dashed border-slate-300 bg-slate-50 text-sm"
              onChange={(event) => {
                setFeaturedFile(event.target.files?.[0] ?? null)
                setUploadErrors((current) => ({ ...current, featuredImage: undefined }))
              }}
              type="file"
            />
            {featuredFile ? (
              <span className="text-xs font-medium text-slate-500">Nueva imagen: {featuredFile.name}</span>
            ) : null}
          </AdminField>
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

          <AdminField error={uploadErrors.gallery} label="Nuevas imágenes">
            <AdminInput
              accept="image/*"
              className="border-dashed border-slate-300 bg-slate-50 text-sm"
              multiple
              onChange={(event) => {
                setGalleryFiles(Array.from(event.target.files ?? []))
                setUploadErrors((current) => ({ ...current, gallery: undefined }))
              }}
              type="file"
            />
          </AdminField>

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

        <AdminField error={errors.shortDescription?.message} label="Descripción corta" required>
          <AdminTextarea className="min-h-28" {...register('shortDescription')} />
        </AdminField>

        <AdminField error={errors.description?.message} label="Descripción" required>
          <AdminTextarea className="min-h-40" {...register('description')} />
        </AdminField>

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
                      <div className="w-full">
                        <AdminInput
                          placeholder="Ej: Mango ergonómico"
                          {...register(`features.${index}.label`)}
                        />
                        <AdminFieldError message={errors.features?.[index]?.label?.message} />
                      </div>
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
                <AdminFieldError message={featuresError} />
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
                      <div>
                        <AdminInput
                          placeholder="Largo"
                          {...register(`specifications.${index}.label`)}
                        />
                        <AdminFieldError message={errors.specifications?.[index]?.label?.message} />
                      </div>
                      <div>
                        <AdminInput
                          placeholder="2.10 metros"
                          {...register(`specifications.${index}.value`)}
                        />
                        <AdminFieldError message={errors.specifications?.[index]?.value?.message} />
                      </div>
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
                <AdminFieldError message={specificationsError} />
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

        {error ? <AdminAlert>{error}</AdminAlert> : null}

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
