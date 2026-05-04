import { Suspense } from 'react'
import Image from 'next/image'
import Link from 'next/link'

import { StoreHeaderClient } from '@/components/store/StoreHeaderClient'

function StoreHeaderFallback({ showSearch = true }: { showSearch?: boolean }) {
  return (
    <header className="sticky top-0 z-50 border-b-4 border-brand-orange bg-[#f7f4ef]/95 shadow-sm backdrop-blur-sm">
      <div className="container-shell py-3">
        <div className="flex items-center justify-between gap-4">
          <Link className="flex shrink-0 items-center gap-3" href="/">
            <Image
              alt="Carancho Outdoors"
              className=" rounded-full border-2 border-white bg-white shadow-[0_8px_20px_rgba(28,28,28,0.12)] sm:h-16 sm:w-16"
              height={90}
              src="/images/brand/carancho-logo.svg"
              width={90}
            />
            <span className="text-[1.45rem] font-extrabold tracking-tight text-brand-ink sm:text-[1.6rem]">
              CARANCHO OUTDOORS
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
