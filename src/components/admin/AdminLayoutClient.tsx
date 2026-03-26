'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'

import { AuthProvider, useAuth } from '@/providers/AuthProvider'
import { QueryProvider } from '@/providers/QueryProvider'

function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { isAuthenticated, isLoading, logout, user } = useAuth()

  useEffect(() => {
    if (!isLoading && pathname !== '/admin/login' && (!isAuthenticated || user?.role !== 'admin')) {
      router.replace('/admin/login')
    }
  }, [isAuthenticated, isLoading, pathname, router, user])

  if (pathname === '/admin/login') {
    return <>{children}</>
  }

  if (isLoading) {
    return <div className="flex min-h-screen items-center justify-center bg-[#fbf7f1] text-sm font-bold">Cargando dashboard...</div>
  }

  if (!isAuthenticated || user?.role !== 'admin') {
    return null
  }

  const navigation = [
    { href: '/admin', label: 'Dashboard' },
    { href: '/admin/productos', label: 'Inventario' },
    { href: '/admin/productos/nuevo', label: 'Nuevo producto' },
  ]

  return (
    <div className="min-h-screen bg-[#fbf7f1]">
      <div className="mx-auto grid min-h-screen max-w-[1600px] lg:grid-cols-[250px_1fr]">
        <aside className="flex flex-col border-r border-[#edf0f5] bg-white">
          <div className="border-b border-[#edf0f5] px-7 py-8">
            <p className="font-display text-[34px] font-black leading-9 text-brand-ink">
              Command
              <br />
              Center
            </p>
            <p className="mt-2 text-xs font-black uppercase tracking-[0.2em] text-slate-400">Carancho Admin</p>
          </div>

          <nav className="flex-1 space-y-2 px-5 py-8">
            {navigation.map((item) => {
              const isActive = pathname === item.href

              return (
                <Link
                  key={item.href}
                  className={`block rounded-r-[14px] border-l-4 px-4 py-3 text-sm font-bold transition ${
                    isActive
                      ? 'border-brand-orange bg-[#fff2eb] text-brand-orange'
                      : 'border-transparent text-slate-500 hover:bg-slate-50 hover:text-brand-ink'
                  }`}
                  href={item.href}
                >
                  {item.label}
                </Link>
              )
            })}
          </nav>

          <div className="px-5 pb-6">
            <div className="flex items-center justify-between rounded-[18px] bg-[#fff7f1] px-4 py-3">
              <div>
                <p className="text-sm font-black text-brand-ink">{user.name}</p>
                <p className="text-xs text-slate-400">{user.email}</p>
              </div>
              <button
                className="text-xs font-black uppercase tracking-[0.18em] text-slate-400 hover:text-brand-orange"
                onClick={() => {
                  void logout().finally(() => router.replace('/admin/login'))
                }}
                type="button"
              >
                Salir
              </button>
            </div>
          </div>
        </aside>

        <div className="flex flex-col">
          <header className="flex items-center justify-between px-6 py-7 lg:px-8">
            <div>
              <h1 className="text-4xl font-black tracking-tight text-brand-ink">Gestión de Productos</h1>
            </div>
            <div className="flex gap-3">
              <Link
                className="rounded-full border border-[#dfe5ef] bg-white px-5 py-3 text-sm font-bold text-brand-ink"
                href="/payload-admin"
              >
                Abrir Payload
              </Link>
              <Link className="rounded-full bg-brand-orange px-5 py-3 text-sm font-black text-white" href="/admin/productos/nuevo">
                Nuevo Producto
              </Link>
            </div>
          </header>

          <main className="flex-1 px-6 pb-8 lg:px-8">{children}</main>
        </div>
      </div>
    </div>
  )
}

export function AdminLayoutClient({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <QueryProvider>
        <AdminShell>{children}</AdminShell>
      </QueryProvider>
    </AuthProvider>
  )
}
