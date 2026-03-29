'use client'

import { useRouter } from 'next/navigation'
import { useForm, type Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

import { AdminAlert, AdminField, AdminInput, AdminSelect } from '@/components/admin/form-primitives'
import { useCategories, useUpsertCategory } from '@/hooks/useAdminCatalog'

const subcategoryFormSchema = z.object({
  name: z.string().trim().min(2, 'El nombre debe tener al menos 2 caracteres'),
  parentId: z.coerce.number().min(1, 'Selecciona una categoría padre'),
})

type SubcategoryFormValues = z.infer<typeof subcategoryFormSchema>

const defaultValues: SubcategoryFormValues = {
  name: '',
  parentId: 0,
}

export function SubcategoryForm() {
  const router = useRouter()
  const categoriesQuery = useCategories()
  const upsertCategoryMutation = useUpsertCategory()
  const {
    formState: { errors },
    handleSubmit,
    register,
  } = useForm<SubcategoryFormValues>({
    defaultValues,
    resolver: zodResolver(subcategoryFormSchema) as Resolver<SubcategoryFormValues>,
  })

  const parentCategories = (categoriesQuery.data?.docs ?? []).filter((category) => !category.parent)
  const error = categoriesQuery.error?.message ?? upsertCategoryMutation.error?.message ?? null

  return (
    <section className="surface-card max-w-4xl p-8">
      <div className="mb-8">
        <p className="text-xs font-bold uppercase tracking-[0.3em] text-brand-orange">Subcategorías</p>
        <h1 className="mt-2 text-3xl font-black text-brand-ink">Nueva subcategoría</h1>
      </div>

      <form
        className="grid gap-6"
        onSubmit={handleSubmit((values) => {
          void upsertCategoryMutation
            .mutateAsync({
              heroAlt: values.name,
              id: null,
              payload: {
                description: null,
                featured: false,
                heroImage: null,
                name: values.name.trim(),
                parent: values.parentId,
              },
            })
            .then(() => {
              router.push('/admin/categorias')
              router.refresh()
            })
        })}
      >
        <div className="grid gap-6 md:grid-cols-2">
          <AdminField error={errors.parentId?.message} label="Categoría padre" required>
            <AdminSelect {...register('parentId')}>
              <option value={0}>Seleccionar categoría padre</option>
              {parentCategories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </AdminSelect>
          </AdminField>

          <AdminField error={errors.name?.message} label="Nombre" required>
            <AdminInput {...register('name')} />
          </AdminField>
        </div>

        {error ? <AdminAlert>{error}</AdminAlert> : null}

        <div className="flex flex-wrap items-center gap-3">
          <button
            className="rounded-full bg-brand-orange px-6 py-3 text-sm font-black uppercase tracking-wide text-white hover:bg-orange-600 disabled:opacity-60"
            disabled={upsertCategoryMutation.isPending}
            type="submit"
          >
            {upsertCategoryMutation.isPending ? 'Guardando...' : 'Crear subcategoría'}
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
