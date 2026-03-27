import Link from 'next/link'

import { StoreMedia } from '@/components/store/StoreMedia'
import type { Category, Media } from '@/payload-types'

type CategoryCardProps = {
  category: Category & {
    heroImage?: Media | null
  }
}

export function CategoryCard({ category }: CategoryCardProps) {
  return (
    <Link
      className="group relative h-56 overflow-hidden rounded-xl"
      href={`/productos?categoria=${category.slug}`}
    >
      <StoreMedia
        alt={category.heroImage?.alt ?? category.name}
        className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
        fallbackLabel={category.name}
        src={category.heroImage?.url}
      />
      <div className="absolute inset-0 bg-[linear-gradient(to_top,rgba(28,28,28,0.72),transparent)]" />
      <div className="absolute bottom-4 left-4 flex items-center gap-2">
        <span className="h-8 w-1 rounded-full bg-brand-orange" />
        <span className="text-lg font-extrabold uppercase tracking-wide text-white">{category.name}</span>
      </div>
    </Link>
  )
}
