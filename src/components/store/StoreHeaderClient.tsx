'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'

import { useNavigationCategories } from '@/hooks/store/useStoreNavigation'
import { useCart } from '@/providers/CartProvider'
import type { CategoryOption } from '@/services/adminApi'

function SearchIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      viewBox="0 0 24 24"
    >
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" strokeLinecap="round" />
    </svg>
  )
}

function ShoppingCartIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      viewBox="0 0 24 24"
    >
      <circle cx="9" cy="20" r="1.5" />
      <circle cx="18" cy="20" r="1.5" />
      <path
        d="M3 4h2l2.2 10.5a1 1 0 0 0 1 .8h8.9a1 1 0 0 0 1-.8L20 8H7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function MenuIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      viewBox="0 0 24 24"
    >
      <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
    </svg>
  )
}

function CloseIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      viewBox="0 0 24 24"
    >
      <path d="m6 6 12 12M18 6 6 18" strokeLinecap="round" />
    </svg>
  )
}

function ChevronDownIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      viewBox="0 0 24 24"
    >
      <path d="m6 9 6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function getCategoryId(category: CategoryOption | number | null | undefined) {
  if (typeof category === 'number') {
    return category
  }

  return category?.id ?? null
}

function isTopLevelCategory(category: CategoryOption) {
  return !category.parent
}

export function StoreHeaderClient({ showSearch = true }: { showSearch?: boolean }) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [catalogOpen, setCatalogOpen] = useState(false)
  const closeTimeoutRef = useRef<number | null>(null)
  const { itemCount } = useCart()
  const navigationCategoriesQuery = useNavigationCategories()
  const navigationCategories = navigationCategoriesQuery.data?.docs ?? []
  const isCatalogPage = pathname === '/productos'
  const topLevelCategories = navigationCategories.filter((category) => isTopLevelCategory(category))
  const groupedCategories = topLevelCategories.map((category) => ({
    ...category,
    children: navigationCategories.filter(
      (candidate) => getCategoryId(candidate.parent) === category.id,
    ),
  }))
  const navigationLinks = [{ href: '/', label: 'Inicio' }]

  useEffect(() => {
    return () => {
      if (closeTimeoutRef.current) {
        window.clearTimeout(closeTimeoutRef.current)
      }
    }
  }, [])

  const openCatalog = () => {
    if (closeTimeoutRef.current) {
      window.clearTimeout(closeTimeoutRef.current)
      closeTimeoutRef.current = null
    }

    setCatalogOpen(true)
  }

  const closeCatalog = () => {
    if (closeTimeoutRef.current) {
      window.clearTimeout(closeTimeoutRef.current)
    }

    closeTimeoutRef.current = window.setTimeout(() => {
      setCatalogOpen(false)
      closeTimeoutRef.current = null
    }, 220)
  }

  const isActiveLink = (href: string) => {
    const [linkPath, queryString] = href.split('?')

    if (linkPath === '/' && pathname === '/') {
      return true
    }

    if (linkPath !== '/' && pathname !== linkPath) {
      return false
    }

    if (!queryString) {
      return pathname === linkPath
    }

    const [key, value] = queryString.split('=')
    return searchParams.get(key) === value
  }

  return (
    <header className="sticky top-0 z-50 border-b-4 border-brand-orange bg-[#f7f4ef]/95 shadow-sm backdrop-blur-sm">
      <div className="container-shell py-3">
        <div className="flex items-center justify-between gap-4">
          <Link className="flex shrink-0 items-center gap-3" href="/">
            <Image
              alt="Carancho Outdoors"
              className="h-[48px] w-[48px] rounded-full border-2 border-white shadow-[0_8px_20px_rgba(28,28,28,0.12)] sm:h-[72px] sm:w-[72px]"
              height={100}
              src="/images/brand/carancho-logo.svg"
              width={100}
            />
            <span className="text-[0.8rem] font-extrabold tracking-tight text-brand-ink sm:text-[1.45rem] md:text-[1.6rem]">
              CARANCHO OUTDOORS
            </span>
          </Link>

          <nav className="hidden items-center gap-4 md:flex">
            {navigationLinks.map((link) => (
              <Link
                key={link.href}
                className={`text-sm font-semibold transition-colors hover:text-brand-orange ${
                  isActiveLink(link.href)
                    ? 'border-b-2 border-brand-orange pb-0.5 text-brand-orange'
                    : 'text-brand-ink'
                }`}
                href={link.href}
              >
                {link.label}
              </Link>
            ))}

            {!isCatalogPage ? (
              <div className="relative" onMouseEnter={openCatalog} onMouseLeave={closeCatalog}>
                <Link
                  aria-expanded={catalogOpen}
                  className="flex items-center gap-2 rounded-full border border-brand-orange bg-brand-orange px-4 py-2 text-sm font-black text-white shadow-[0_12px_24px_rgba(240,97,25,0.18)] hover:brightness-105"
                  href="/productos"
                  onBlur={closeCatalog}
                  onFocus={openCatalog}
                >
                  <span>Ver productos</span>
                  <ChevronDownIcon />
                </Link>

                <div
                  className={`absolute left-1/2 top-[calc(100%+16px)] z-50 w-screen max-w-[100vw] -translate-x-1/2 px-6 transition-all duration-220 ease-out ${
                    catalogOpen
                      ? 'pointer-events-auto translate-y-0 opacity-100'
                      : 'pointer-events-none translate-y-2 opacity-0'
                  }`}
                  onMouseEnter={openCatalog}
                  onMouseLeave={closeCatalog}
                >
                  <div className="mx-auto w-full max-w-7xl rounded-[30px] border border-[#e2d9ce] bg-[#f7f4ef] p-8 shadow-[0_24px_60px_rgba(20,18,16,0.18)]">
                    <div className="grid gap-x-10 gap-y-8 md:grid-cols-3 xl:grid-cols-5">
                      {groupedCategories.map((category) => (
                        <div key={category.id}>
                          <Link
                            className="text-[1.05rem] font-black uppercase tracking-[0.04em] text-brand-ink hover:text-brand-orange"
                            href={`/productos?categoria=${category.slug}`}
                          >
                            {category.name}
                          </Link>
                          {category.children.length ? (
                            <div className="mt-4 space-y-2">
                              {category.children.map((child) => (
                                <Link
                                  className="block text-[0.95rem] font-medium text-slate-600 transition-colors hover:text-brand-orange"
                                  href={`/productos?categoria=${child.slug}`}
                                  key={child.id}
                                >
                                  {child.name}
                                </Link>
                              ))}
                            </div>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ) : null}
          </nav>

          {showSearch ? (
            <form action="/productos" className="relative hidden max-w-sm flex-1 sm:flex">
              <input
                className="w-full rounded-lg bg-[#ebe7e1] py-2.5 pl-10 pr-4 text-sm text-brand-ink placeholder:text-slate-500 focus:ring-2 focus:ring-brand-orange focus:outline-none"
                name="q"
                placeholder="Buscar productos..."
                type="search"
              />
              <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
                <SearchIcon />
              </div>
            </form>
          ) : (
            <div className="hidden flex-1 sm:block" />
          )}

          <div className="flex items-center gap-3">
            <Link
              className="relative rounded-lg p-2 transition-colors hover:bg-[#ebe7e1]"
              href="/carrito"
            >
              <ShoppingCartIcon />
              <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-brand-orange text-[10px] font-bold text-white">
                {itemCount}
              </span>
            </Link>
            <button
              aria-label={mobileOpen ? 'Cerrar menú' : 'Abrir menú'}
              className="rounded-lg p-2 md:hidden"
              onClick={() => {
                setMobileOpen((open) => !open)
              }}
              type="button"
            >
              {mobileOpen ? <CloseIcon /> : <MenuIcon />}
            </button>
          </div>
        </div>

        {mobileOpen ? (
          <nav className="mt-4 flex flex-col gap-2 border-t border-brand-border pb-2 pt-4 md:hidden">
            {navigationLinks.map((link) => (
              <Link
                key={link.href}
                className={`rounded-lg px-4 py-3 text-base font-semibold transition-colors hover:bg-[#ebe7e1] ${
                  isActiveLink(link.href) ? 'bg-[#fff1e8] text-brand-orange' : 'text-brand-ink'
                }`}
                href={link.href}
                onClick={() => {
                  setMobileOpen(false)
                }}
              >
                {link.label}
              </Link>
            ))}
            <Link
              className="rounded-lg bg-brand-orange px-4 py-3 text-base font-black text-white shadow-[0_12px_24px_rgba(240,97,25,0.18)]"
              href="/productos"
              onClick={() => {
                setMobileOpen(false)
              }}
            >
              Ver productos
            </Link>
            <div className="mt-2 space-y-4 rounded-[22px] border border-brand-border bg-white/70 p-4">
              {groupedCategories.map((category) => (
                <div key={category.id}>
                  <Link
                    className="text-sm font-black uppercase tracking-[0.08em] text-brand-ink"
                    href={`/productos?categoria=${category.slug}`}
                    onClick={() => {
                      setMobileOpen(false)
                    }}
                  >
                    {category.name}
                  </Link>
                  {category.children.length ? (
                    <div className="mt-2 space-y-1.5 pl-3">
                      {category.children.map((child) => (
                        <Link
                          className="block text-sm text-slate-500"
                          href={`/productos?categoria=${child.slug}`}
                          key={child.id}
                          onClick={() => {
                            setMobileOpen(false)
                          }}
                        >
                          {child.name}
                        </Link>
                      ))}
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
            <form action="/productos" className="relative mt-2">
              <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
                <SearchIcon />
              </div>
              <input
                className="w-full rounded-lg bg-[#ebe7e1] py-3 pl-10 pr-4 text-sm text-brand-ink placeholder:text-slate-500 focus:ring-2 focus:ring-brand-orange focus:outline-none"
                name="q"
                placeholder="Buscar productos..."
                type="search"
              />
            </form>
          </nav>
        ) : null}
      </div>
    </header>
  )
}
