'use client'

import { useEffect } from 'react'
import { useForm, type Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

import { AdminAlert, AdminField, AdminInput } from '@/components/admin/form-primitives'
import { useAdminStoreContact, useUpsertStoreContact } from '@/hooks/admin/useAdminStoreContact'

const storeContactSchema = z.object({
  address: z.string().optional(),
  email: z.union([z.literal(''), z.string().trim().email('Ingresá un email válido')]).optional(),
  phone: z.string().optional(),
})

type StoreContactFormValues = z.infer<typeof storeContactSchema>

const fallbackValues: StoreContactFormValues = {
  address: '',
  email: '',
  phone: '',
}

export function StoreContactForm() {
  const storeContactQuery = useAdminStoreContact()
  const upsertStoreContactMutation = useUpsertStoreContact()
  const {
    formState: { errors },
    handleSubmit,
    register,
    reset,
  } = useForm<StoreContactFormValues>({
    defaultValues: fallbackValues,
    resolver: zodResolver(storeContactSchema) as Resolver<StoreContactFormValues>,
  })

  useEffect(() => {
    if (storeContactQuery.isLoading) {
      return
    }

    reset({
      address: storeContactQuery.data?.address ?? fallbackValues.address,
      email: storeContactQuery.data?.email ?? fallbackValues.email,
      phone: storeContactQuery.data?.phone ?? fallbackValues.phone,
    })
  }, [reset, storeContactQuery.data, storeContactQuery.isLoading])

  const error = storeContactQuery.error?.message ?? upsertStoreContactMutation.error?.message ?? null

  if (storeContactQuery.isLoading) {
    return <div className="rounded-3xl bg-white p-6 text-sm font-bold text-slate-500">Cargando contacto...</div>
  }

  return (
    <section className="surface-card max-w-4xl p-8">
      <div className="mb-8">
        <p className="text-xs font-bold uppercase tracking-[0.3em] text-brand-orange">Storefront</p>
        <h1 className="mt-2 text-3xl font-black text-brand-ink">Información de contacto</h1>
        <p className="mt-2 text-sm text-slate-500">Estos datos alimentan el bloque de contacto del footer de la tienda.</p>
      </div>

      <form
        className="grid gap-6"
        onSubmit={handleSubmit((values) => {
          void upsertStoreContactMutation
            .mutateAsync({
              id: storeContactQuery.data ? String(storeContactQuery.data.id) : null,
              payload: {
                address: values.address?.trim() || null,
                email: values.email?.trim() || null,
                phone: values.phone?.trim() || null,
              },
            })
            .then((savedContact) => {
              reset({
                address: savedContact.address ?? fallbackValues.address,
                email: savedContact.email ?? fallbackValues.email,
                phone: savedContact.phone ?? fallbackValues.phone,
              })
            })
        })}
      >
        <AdminField error={errors.address?.message} label="Dirección">
          <AdminInput {...register('address')} />
        </AdminField>

        <div className="grid gap-6 md:grid-cols-2">
          <AdminField error={errors.phone?.message} label="Teléfono">
            <AdminInput {...register('phone')} />
          </AdminField>

          <AdminField error={errors.email?.message} label="Email">
            <AdminInput {...register('email')} type="email" />
          </AdminField>
        </div>

        {error ? <AdminAlert>{error}</AdminAlert> : null}

        <div className="flex flex-wrap items-center gap-3">
          <button
            className="rounded-full bg-brand-orange px-6 py-3 text-sm font-black uppercase tracking-wide text-white hover:bg-orange-600 disabled:opacity-60"
            disabled={upsertStoreContactMutation.isPending}
            type="submit"
          >
            {upsertStoreContactMutation.isPending ? 'Guardando...' : 'Guardar contacto'}
          </button>
        </div>
      </form>
    </section>
  )
}
