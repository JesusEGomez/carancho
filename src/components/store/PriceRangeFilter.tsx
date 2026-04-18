'use client'

import { useEffect, useMemo, useState, useTransition } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'

type PriceRangeFilterProps = {
  maxValue: number
  value: number
}

const currencyFormatter = new Intl.NumberFormat('es-AR', {
  maximumFractionDigits: 0,
})

export function PriceRangeFilter({ maxValue, value }: PriceRangeFilterProps) {
  const pathname = usePathname()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [, startTransition] = useTransition()
  const [draftValue, setDraftValue] = useState(value)

  useEffect(() => {
    setDraftValue(value)
  }, [value])

  const progress = useMemo(() => {
    if (maxValue <= 0) {
      return 100
    }

    return Math.max(0, Math.min(100, (draftValue / maxValue) * 100))
  }, [draftValue, maxValue])

  useEffect(() => {
    const currentQueryValue = Number(searchParams.get('maxPrice') ?? maxValue)

    if (currentQueryValue === draftValue) {
      return
    }

    const timeoutId = window.setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString())

      if (draftValue >= maxValue) {
        params.delete('maxPrice')
      } else {
        params.set('maxPrice', String(draftValue))
      }

      params.delete('page')

      const nextQuery = params.toString()
      const nextUrl = nextQuery ? `${pathname}?${nextQuery}` : pathname

      startTransition(() => {
        router.replace(nextUrl, { scroll: false })
      })
    }, 180)

    return () => {
      window.clearTimeout(timeoutId)
    }
  }, [draftValue, maxValue, pathname, router, searchParams])

  return (
    <div className="mt-4">
      <div className="mb-4 flex items-center justify-between gap-3">
        <span className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">Tope actual</span>
        <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-sm font-black text-brand-ink">
          ${currencyFormatter.format(draftValue)}
        </span>
      </div>
      <div className="relative h-2 rounded-full bg-slate-200/90">
        <div className="absolute inset-y-0 left-0 rounded-full bg-brand-orange" style={{ width: `${progress}%` }} />
        <input
          aria-label="Filtrar por precio máximo"
          className="absolute inset-0 h-2 w-full cursor-pointer appearance-none bg-transparent [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-4 [&::-moz-range-thumb]:border-white [&::-moz-range-thumb]:bg-brand-orange [&::-webkit-slider-runnable-track]:h-2 [&::-webkit-slider-runnable-track]:bg-transparent [&::-webkit-slider-thumb]:mt-[-6px] [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-4 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:bg-brand-orange [&::-webkit-slider-thumb]:shadow-[0_6px_16px_rgba(240,90,25,0.35)]"
          max={maxValue}
          min={0}
          onChange={(event) => {
            setDraftValue(Number(event.target.value))
          }}
          step={500}
          type="range"
          value={draftValue}
        />
      </div>
      <div className="mt-3 flex justify-between text-xs font-bold text-slate-400">
        <span>$0</span>
        <span>${currencyFormatter.format(maxValue)}</span>
      </div>
    </div>
  )
}
