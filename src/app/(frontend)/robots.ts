import type { MetadataRoute } from 'next'

import { getSiteUrl } from '@/lib/seo'

export default function robots(): MetadataRoute.Robots {
  const siteUrl = getSiteUrl()

  return {
    rules: {
      allow: '/',
      disallow: [
        '/admin',
        '/admin/',
        '/api/',
        '/carrito',
        '/checkout',
        '/checkout/',
        '/payload-admin',
        '/payload-admin/',
      ],
      userAgent: '*',
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  }
}
