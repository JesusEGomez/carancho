import Image from 'next/image'
import Link from 'next/link'

export function StoreHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-brand-orange/10 bg-white/95 backdrop-blur">
      <div className="container-shell py-4">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center justify-between gap-4">
              <Link href="/" className="flex items-center gap-3">
                <div className="relative h-12 w-12 overflow-hidden rounded-full border-2 border-brand-orange bg-white shadow-[0_8px_18px_rgba(240,90,25,0.18)]">
                  <Image
                    alt="Logo Carancho Pesca Deportiva"
                    className="object-cover"
                    fill
                    sizes="48px"
                    src="/images/brand/carancho-logo.jpg"
                  />
                </div>
                <div>
                  <p className="font-display text-xl font-black uppercase tracking-tight text-brand-ink">
                    Carancho <span className="text-brand-orange">Pesca</span>
                  </p>
                </div>
              </Link>

              <Link
                href="/admin/login"
                className="rounded-full border border-slate-200 px-4 py-2 text-sm font-bold text-slate-600 hover:border-brand-orange hover:text-brand-orange lg:hidden"
              >
                Admin
              </Link>
            </div>

            <form action="/productos" className="flex flex-1 items-center gap-2 lg:max-w-xl">
              <input
                className="h-11 flex-1 rounded-full border border-slate-200 bg-slate-50 px-5 text-sm outline-none transition focus:border-brand-orange"
                name="q"
                placeholder="Buscar cañas, señuelos, artículos para el hogar..."
                type="search"
              />
              <button className="h-11 rounded-[12px] bg-brand-orange px-5 text-xs font-black uppercase tracking-[0.14em] text-white">
                Buscar
              </button>
            </form>

            <div className="hidden items-center gap-5 lg:flex">
              <Link
                href="/admin/login"
                className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 hover:text-brand-orange"
              >
                Mi cuenta
              </Link>
              <Link href="/admin/login" className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.2em] text-brand-ink">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-sm">🛒</span>
                <span>Mi carrito</span>
              </Link>
            </div>
          </div>

          <div className="flex items-center justify-center border-t border-brand-orange/15 pt-3">
            <nav className="flex flex-wrap items-center justify-center gap-5 text-[11px] font-black uppercase tracking-[0.2em] text-slate-500">
              <Link href="/" className="border-b-2 border-brand-orange pb-1 text-brand-ink">
                Inicio
              </Link>
              <Link href="/productos" className="pb-1 hover:text-brand-orange">
                Catálogo
              </Link>
              <Link href="/productos?categoria=canas-y-reels" className="pb-1 hover:text-brand-orange">
                Pesca
              </Link>
              <Link href="/productos?categoria=senuelos" className="pb-1 hover:text-brand-orange">
                Camping
              </Link>
              <Link href="/productos?categoria=hogar" className="pb-1 hover:text-brand-orange">
                Hogar
              </Link>
              <a href="/#contacto" className="pb-1 hover:text-brand-orange">
                Contacto
              </a>
            </nav>
          </div>
        </div>
      </div>
    </header>
  )
}
