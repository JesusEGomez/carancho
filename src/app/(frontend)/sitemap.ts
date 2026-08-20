import type { MetadataRoute } from 'next'

import { getSitemapProducts } from '@/lib/store'
import { getSiteUrl } from '@/lib/seo'

export const dynamic = 'force-dynamic'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = getSiteUrl()
  const products = await getSitemapProducts()

  return [
    {
      changeFrequency: 'weekly',
      priority: 1,
      url: siteUrl,
    },
    {
      changeFrequency: 'daily',
      priority: 0.9,
      url: `${siteUrl}/productos`,
    },
    ...products.map((product) => ({
      changeFrequency: 'weekly' as const,
      lastModified: product.updatedAt,
      priority: 0.8,
      url: `${siteUrl}/productos/${product.slug}`,
    })),
  ]
}
