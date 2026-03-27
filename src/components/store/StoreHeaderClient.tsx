'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import { useState } from 'react'

const navLinks = [
  { href: '/', label: 'Inicio' },
  { href: '/productos?categoria=canas-y-reels', label: 'Pesca' },
  { href: '/productos?categoria=camping', label: 'Camping' },
  { href: '/productos?categoria=hogar', label: 'Hogar' },
] as const

function SearchIcon() {
  return (
    <svg aria-hidden="true" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" strokeLinecap="round" />
    </svg>
  )
}

function ShoppingCartIcon() {
  return (
    <svg aria-hidden="true" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <circle cx="9" cy="20" r="1.5" />
      <circle cx="18" cy="20" r="1.5" />
      <path d="M3 4h2l2.2 10.5a1 1 0 0 0 1 .8h8.9a1 1 0 0 0 1-.8L20 8H7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function UserIcon() {
  return (
    <svg aria-hidden="true" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <circle cx="12" cy="8" r="4" />
      <path d="M5 20c1.8-3.3 4.1-5 7-5s5.2 1.7 7 5" strokeLinecap="round" />
    </svg>
  )
}

function MenuIcon() {
  return (
    <svg aria-hidden="true" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
    </svg>
  )
}

function CloseIcon() {
  return (
    <svg aria-hidden="true" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path d="m6 6 12 12M18 6 6 18" strokeLinecap="round" />
    </svg>
  )
}

export function StoreHeaderClient() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [mobileOpen, setMobileOpen] = useState(false)

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
    <header className="sticky top-0 z-50 border-b-4 border-brand-orange bg-white/95 shadow-sm backdrop-blur-sm">
      <div className="container-shell py-3">
        <div className="flex items-center justify-between gap-4">
          <Link className="flex shrink-0 items-center gap-3" href="/">
            <Image
              alt="Carancho Pesca Deportiva"
              className="h-10 w-10 rounded-full object-cover"
              height={40}
              src="/images/brand/carancho-logo.jpg"
              width={40}
            />
            <span className="text-xl font-extrabold tracking-tight text-brand-ink">
              CARANCHO <span className="text-brand-orange">PESCA</span>
            </span>
          </Link>

          <nav className="hidden items-center gap-6 md:flex">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                className={`text-sm font-semibold transition-colors hover:text-brand-orange ${
                  isActiveLink(link.href) ? 'border-b-2 border-brand-orange pb-0.5 text-brand-orange' : 'text-brand-ink'
                }`}
                href={link.href}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <form action="/productos" className="relative hidden max-w-sm flex-1 sm:flex">
            <input
              className="w-full rounded-lg bg-[#f1eeea] py-2.5 pl-10 pr-4 text-sm text-brand-ink placeholder:text-slate-500 focus:ring-2 focus:ring-brand-orange focus:outline-none"
              name="q"
              placeholder="Buscar productos..."
              type="search"
            />
            <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
              <SearchIcon />
            </div>
          </form>

          <div className="flex items-center gap-3">
            <button className="relative rounded-lg p-2 transition-colors hover:bg-[#f1eeea]" type="button">
              <ShoppingCartIcon />
              <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-brand-orange text-[10px] font-bold text-white">
                0
              </span>
            </button>
            <Link className="hidden rounded-lg p-2 transition-colors hover:bg-[#f1eeea] sm:block" href="/admin/login">
              <UserIcon />
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
            {navLinks.map((link) => (
              <Link
                key={link.href}
                className={`rounded-lg px-4 py-3 text-base font-semibold transition-colors hover:bg-[#f1eeea] ${
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
              className="rounded-lg px-4 py-3 text-base font-semibold transition-colors hover:bg-[#f1eeea]"
              href="/admin/login"
              onClick={() => {
                setMobileOpen(false)
              }}
            >
              Admin
            </Link>
            <form action="/productos" className="relative mt-2">
              <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
                <SearchIcon />
              </div>
              <input
                className="w-full rounded-lg bg-[#f1eeea] py-3 pl-10 pr-4 text-sm text-brand-ink placeholder:text-slate-500 focus:ring-2 focus:ring-brand-orange focus:outline-none"
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
