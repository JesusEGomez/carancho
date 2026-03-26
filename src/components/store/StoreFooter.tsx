import Image from 'next/image'

type StoreFooterProps = {
  variant?: 'light' | 'dark'
}

export function StoreFooter({ variant = 'dark' }: StoreFooterProps) {
  const isDark = variant === 'dark'

  return (
    <footer
      id="contacto"
      className={`mt-20 ${isDark ? 'bg-brand-panel text-white' : 'border-t border-brand-orange/10 bg-white text-brand-ink'}`}
    >
      <div className="container-shell grid gap-10 py-14 lg:grid-cols-[1.1fr_1fr_1fr]">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
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
              <p className="font-display text-xl font-black">Carancho</p>
              <p className={isDark ? 'text-sm text-slate-300' : 'text-sm text-slate-500'}>Pesca Deportiva</p>
            </div>
          </div>
          <p className={`max-w-sm text-sm leading-7 ${isDark ? 'text-slate-300' : 'text-slate-500'}`}>
            Pasión por la pesca y dedicación a tu hogar. Ofrecemos los mejores productos con atención personalizada.
          </p>
        </div>

        <div className={`space-y-3 text-sm ${isDark ? 'text-slate-300' : 'text-slate-500'}`}>
          <h3 className={`text-sm font-black uppercase tracking-[0.16em] ${isDark ? 'text-white' : 'text-brand-ink'}`}>
            Nuestra tienda
          </h3>
          <p>Cañas de Pesca</p>
          <p>Reels y Accesorios</p>
          <p>Hogar y Outdoor</p>
          <p>Preguntas Frecuentes</p>
        </div>

        <div className={`space-y-3 text-sm ${isDark ? 'text-slate-300' : 'text-slate-500'}`}>
          <h3 className={`text-sm font-black uppercase tracking-[0.16em] ${isDark ? 'text-white' : 'text-brand-ink'}`}>
            Contacto
          </h3>
          <p>Calle Principal 125, Provincia, Argentina</p>
          <p>+54 (011) 4567-8910</p>
          <p>hola@caranchopesca.com.ar</p>
        </div>
      </div>

      <div className={`${isDark ? 'border-t border-white/10' : 'border-t border-slate-200'} py-4`}>
        <div
          className={`container-shell flex flex-col gap-3 text-xs md:flex-row md:items-center md:justify-between ${
            isDark ? 'text-slate-400' : 'text-slate-400'
          }`}
        >
          <p>© 2026 Carancho Pesca Deportiva. Todos los derechos reservados.</p>
          <div className="flex gap-5">
            <p>Términos y Condiciones</p>
            <p>Privacidad</p>
          </div>
        </div>
      </div>
    </footer>
  )
}
