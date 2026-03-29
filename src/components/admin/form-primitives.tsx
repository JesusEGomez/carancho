import type { ComponentPropsWithoutRef, ReactNode } from 'react'

type AdminFieldProps = {
  children: ReactNode
  error?: string
  label: string
  required?: boolean
}

export function AdminField({ children, error, label, required = false }: AdminFieldProps) {
  return (
    <label className="grid gap-2 text-sm font-bold text-brand-ink">
      <span>
        {label}
        {required ? <span className="ml-1 text-red-500">*</span> : null}
      </span>
      {children}
      <AdminFieldError message={error} />
    </label>
  )
}

type AdminFieldErrorProps = {
  message?: string
}

export function AdminFieldError({ message }: AdminFieldErrorProps) {
  return message ? <span className="text-xs font-semibold text-red-600">{message}</span> : null
}

export function AdminInput(props: ComponentPropsWithoutRef<'input'>) {
  return (
    <input
      {...props}
      className={`rounded-2xl border border-slate-200 px-4 py-3 font-medium outline-none focus:border-brand-orange ${props.className ?? ''}`.trim()}
    />
  )
}

export function AdminTextarea(props: ComponentPropsWithoutRef<'textarea'>) {
  return (
    <textarea
      {...props}
      className={`rounded-3xl border border-slate-200 px-4 py-3 font-medium outline-none focus:border-brand-orange ${props.className ?? ''}`.trim()}
    />
  )
}

export function AdminSelect(props: ComponentPropsWithoutRef<'select'>) {
  return (
    <select
      {...props}
      className={`rounded-2xl border border-slate-200 px-4 py-3 font-medium outline-none focus:border-brand-orange ${props.className ?? ''}`.trim()}
    />
  )
}

type AdminAlertProps = {
  children: ReactNode
  tone?: 'error'
}

export function AdminAlert({ children, tone = 'error' }: AdminAlertProps) {
  if (tone === 'error') {
    return <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm font-bold text-red-600">{children}</p>
  }

  return null
}
