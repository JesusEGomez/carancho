type StoreMediaProps = {
  alt: string
  className: string
  fallbackLabel?: string
  src?: string | null
}

export function StoreMedia({ alt, className, fallbackLabel = alt, src }: StoreMediaProps) {
  if (src?.startsWith('linear-gradient(')) {
    return (
      <div
        aria-label={alt}
        className={className}
        role="img"
        style={{ backgroundImage: src }}
      >
        <div className="flex h-full w-full items-end bg-[linear-gradient(180deg,transparent_30%,rgba(15,23,42,0.28)_100%)] p-4 text-xs font-black uppercase tracking-[0.28em] text-white/80">
          {fallbackLabel}
        </div>
      </div>
    )
  }

  if (src) {
    return <img alt={alt} className={className} src={src} />
  }

  return (
    <div className={`${className} flex items-center justify-center bg-slate-200 text-sm font-bold text-slate-500`}>
      {fallbackLabel}
    </div>
  )
}
