function CompassIcon() {
  return (
    <svg aria-hidden="true" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="9" />
      <path d="m14.8 9.2-1.9 5.6-5.7 1.9 1.9-5.7 5.7-1.8Z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function BoxIcon() {
  return (
    <svg aria-hidden="true" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M12 3 4.5 7.2v9.6L12 21l7.5-4.2V7.2L12 3Z" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M4.5 7.2 12 12l7.5-4.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M12 12v9" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function ShieldIcon() {
  return (
    <svg aria-hidden="true" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M12 3c2.9 2 5.6 3 8 3v5c0 5.2-3.4 8.8-8 10-4.6-1.2-8-4.8-8-10V6c2.4 0 5.1-1 8-3Z" strokeLinecap="round" strokeLinejoin="round" />
      <path d="m9.5 12 1.7 1.7 3.3-3.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function ChatIcon() {
  return (
    <svg aria-hidden="true" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M7 18.5c-2.6-1.5-4-4-4-6.8C3 6.9 7 3 12 3s9 3.9 9 8.7-4 8.8-9 8.8c-1.2 0-2.4-.2-3.5-.6L4 21l1.3-4.1" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M8.5 11.5h7" strokeLinecap="round" />
      <path d="M8.5 8.5h5" strokeLinecap="round" />
    </svg>
  )
}

const BENEFITS = [
  {
    description: 'Te ayudamos a elegir el equipo indicado según tu salida, nivel y presupuesto.',
    icon: <CompassIcon />,
    title: 'Asesoramiento real',
  },
  {
    description: 'Publicamos disponibilidad real para que compres con mayor certeza.',
    icon: <BoxIcon />,
    title: 'Stock actualizado',
  },
  {
    description: 'Trabajamos productos seleccionados para pesca, outdoor y hogar.',
    icon: <ShieldIcon />,
    title: 'Marcas confiables',
  },
  {
    description: 'Respondemos consultas y acompañamos la compra de forma personalizada.',
    icon: <ChatIcon />,
    title: 'Atención cercana',
  },
] as const

export function StoreBenefitsSection() {
  return (
    <section className="bg-brand-panel py-16 text-white sm:py-18">
      <div className="container-shell">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-[11px] font-black uppercase tracking-[0.22em] text-brand-orange">Por qué elegir Carancho</p>
          <h2 className="mt-4 text-3xl font-black sm:text-4xl">Comprá con confianza</h2>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">
            Equipamos jornadas de pesca, aventuras outdoor y espacios del hogar con una selección cuidada y atención cercana.
          </p>
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {BENEFITS.map((benefit) => (
            <article
              className="rounded-[22px] border border-white/10 bg-white/5 p-5 shadow-[0_18px_38px_rgba(15,23,42,0.16)] backdrop-blur-sm"
              key={benefit.title}
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-orange text-white shadow-[0_12px_24px_rgba(240,90,25,0.24)]">
                {benefit.icon}
              </div>
              <h3 className="mt-5 text-sm font-black uppercase tracking-[0.12em] text-white">{benefit.title}</h3>
              <p className="mt-3 text-sm leading-6 text-slate-300">{benefit.description}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
