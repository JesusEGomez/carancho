'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { z } from 'zod'

import { useAuth } from '@/providers/AuthProvider'

const loginSchema = z.object({
  email: z.email('Ingresa un email valido'),
  password: z.string().min(1, 'La password es obligatoria'),
})

type LoginFormValues = z.infer<typeof loginSchema>

export default function AdminLoginPage() {
  const router = useRouter()
  const { login } = useAuth()
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const {
    formState: { errors },
    handleSubmit,
    register,
  } = useForm<LoginFormValues>({
    defaultValues: {
      email: 'dev@payloadcms.com',
      password: 'test',
    },
    resolver: zodResolver(loginSchema),
  })

  return (
    <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(242,197,0,0.30),_transparent_32%),linear-gradient(135deg,#fff8e9_0%,#ffffff_45%,#ffe8d8_100%)] p-6">
      <div className="w-full max-w-md rounded-[32px] border border-[#dfe5ef] bg-white p-8 shadow-[0_25px_70px_rgba(15,23,42,0.10)]">
        <p className="text-xs font-black uppercase tracking-[0.32em] text-brand-orange">Admin Access</p>
        <h1 className="mt-4 text-5xl font-black tracking-tight text-brand-ink">Carancho Dashboard</h1>
        <p className="mt-5 text-base leading-8 text-slate-500">
          Ingresar con un usuario admin de Payload para administrar productos y categorías.
        </p>

        <form
          className="mt-10 grid gap-5"
          onSubmit={handleSubmit((values) => {
            setIsSubmitting(true)
            setError(null)

            void login(values.email, values.password)
              .then(() => router.replace('/admin'))
              .catch((cause: Error) => setError(cause.message))
              .finally(() => setIsSubmitting(false))
          })}
        >
          <label className="grid gap-2 text-sm font-bold text-brand-ink">
            Email
            <input
              autoComplete="email"
              className="h-12 rounded-[18px] border border-[#dfe5ef] px-4 font-medium outline-none focus:border-brand-orange"
              {...register('email')}
              type="email"
            />
            {errors.email ? <span className="text-xs font-semibold text-red-600">{errors.email.message}</span> : null}
          </label>

          <label className="grid gap-2 text-sm font-bold text-brand-ink">
            Password
            <input
              autoComplete="current-password"
              className="h-12 rounded-[18px] border border-[#dfe5ef] px-4 font-medium outline-none focus:border-brand-orange"
              {...register('password')}
              type="password"
            />
            {errors.password ? <span className="text-xs font-semibold text-red-600">{errors.password.message}</span> : null}
          </label>

          {error ? <p className="rounded-[18px] bg-red-50 px-4 py-3 text-sm font-bold text-red-600">{error}</p> : null}

          <button
            className="mt-2 h-14 rounded-full bg-brand-orange text-base font-black uppercase tracking-[0.12em] text-white hover:bg-orange-600 disabled:opacity-60"
            disabled={isSubmitting}
            type="submit"
          >
            {isSubmitting ? 'Ingresando...' : 'Ingresar'}
          </button>
        </form>
      </div>
    </div>
  )
}
