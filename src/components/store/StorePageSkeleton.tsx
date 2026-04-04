import { StoreFooter } from '@/components/store/StoreFooter'
import { StoreHeader } from '@/components/store/StoreHeader'

export function StorePageSkeleton({
  asideLines = 4,
  heroWidth = 'w-80',
  rows = 3,
}: {
  asideLines?: number
  heroWidth?: string
  rows?: number
}) {
  return (
    <div className="min-h-screen bg-[#fbf7f1]">
      <StoreHeader />
      <div className="container-shell py-8 sm:py-10">
        <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
          <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_12px_32px_rgba(28,28,28,0.06)]">
            <div className="h-3 w-20 animate-pulse rounded-full bg-slate-200" />
            <div className={`mt-4 h-12 animate-pulse rounded-full bg-slate-100 ${heroWidth}`} />

            <div className="mt-8 space-y-5">
              {Array.from({ length: rows }, (_, index) => (
                <div className="space-y-3" key={index}>
                  <div className="h-4 w-32 animate-pulse rounded-full bg-slate-200" />
                  <div className="h-12 w-full animate-pulse rounded-2xl bg-slate-100" />
                </div>
              ))}
            </div>
          </section>

          <aside className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_12px_32px_rgba(28,28,28,0.06)]">
            <div className="h-3 w-24 animate-pulse rounded-full bg-slate-200" />
            <div className="mt-5 space-y-4">
              {Array.from({ length: asideLines }, (_, index) => (
                <div className="rounded-[20px] border border-slate-100 p-4" key={index}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-2">
                      <div className="h-4 w-32 animate-pulse rounded-full bg-slate-200" />
                      <div className="h-3 w-24 animate-pulse rounded-full bg-slate-100" />
                    </div>
                    <div className="h-4 w-16 animate-pulse rounded-full bg-slate-100" />
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 space-y-3 border-t border-slate-100 pt-6">
              <div className="flex items-center justify-between">
                <div className="h-4 w-32 animate-pulse rounded-full bg-slate-200" />
                <div className="h-4 w-16 animate-pulse rounded-full bg-slate-100" />
              </div>
              <div className="flex items-center justify-between">
                <div className="h-4 w-20 animate-pulse rounded-full bg-slate-200" />
                <div className="h-4 w-24 animate-pulse rounded-full bg-slate-100" />
              </div>
            </div>

            <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-6">
              <div className="h-5 w-16 animate-pulse rounded-full bg-slate-200" />
              <div className="h-5 w-20 animate-pulse rounded-full bg-slate-100" />
            </div>

            <div className="mt-6 h-12 w-full animate-pulse rounded-full bg-slate-200" />
            <div className="mt-3 h-12 w-full animate-pulse rounded-full bg-slate-100" />
          </aside>
        </div>
      </div>
      <StoreFooter />
    </div>
  )
}
