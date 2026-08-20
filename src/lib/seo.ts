const FALLBACK_SITE_URL = 'http://localhost:3000'

export function getSiteUrl() {
  const configuredUrl =
    process.env.NEXT_PUBLIC_SITE_URL ??
    process.env.MERCADOPAGO_PUBLIC_BASE_URL ??
    process.env.VERCEL_PROJECT_PRODUCTION_URL ??
    process.env.VERCEL_URL

  if (!configuredUrl) {
    return FALLBACK_SITE_URL
  }

  const url = configuredUrl.startsWith('http') ? configuredUrl : `https://${configuredUrl}`
  return url.replace(/\/$/, '')
}

export function absoluteUrl(path: string) {
  return new URL(path, `${getSiteUrl()}/`).toString()
}

export function serializeJsonLd(value: unknown) {
  return JSON.stringify(value).replace(/</g, '\\u003c')
}
