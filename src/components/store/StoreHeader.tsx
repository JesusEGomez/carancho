import { Suspense } from 'react'
import Image from 'next/image'
import Link from 'next/link'

import { StoreHeaderClient } from '@/components/store/StoreHeaderClient'

function StoreHeaderFallback({ showSearch = true }: { showSearch?: boolean }) {
  return (
    <header className="sticky top-0 z-50 border-b-4 border-brand-orange bg-[#f7f4ef]/95 shadow-sm backdrop-blur-sm">
      <div className="container-shell py-3">
        <div className="flex items-center justify-between gap-4">
          <Link className="flex shrink-0 flex-col items-center gap-1" href="/">
            <Image
              alt="Carancho Outdoors"
              className="h-[48px] w-[48px] rounded-full border-2 border-white bg-white shadow-[0_8px_20px_rgba(28,28,28,0.12)] sm:h-[64px] sm:w-[64px]"
              height={100}
              src="/images/brand/carancho-logo.svg"
              width={100}
            />
            <span className="text-[0.7rem] font-extrabold uppercase tracking-tight text-brand-ink sm:text-[0.8rem]">
              Carancho Outdoors
            </span>
          </Link>

          {showSearch ? (
            <div className="hidden h-10 max-w-sm flex-1 rounded-lg bg-[#ebe7e1] sm:block" />
          ) : (
            <div className="hidden flex-1 sm:block" />
          )}

          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-[#f1eeea]" />
            <div className="hidden h-9 w-9 rounded-lg bg-[#f1eeea] sm:block" />
            <div className="h-9 w-9 rounded-lg bg-[#f1eeea] md:hidden" />
          </div>
        </div>
      </div>
    </header>
  )
}

export function StoreHeader({ showSearch = true }: { showSearch?: boolean }) {
  return (
    <Suspense fallback={<StoreHeaderFallback showSearch={showSearch} />}>
      <StoreHeaderClient showSearch={showSearch} />
    </Suspense>
  )
}
