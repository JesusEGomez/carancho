import type { CollectionBeforeValidateHook } from 'payload'

import { formatSlug } from '@/lib/formatSlug'

type SupportedCollection = 'categories' | 'products'

export function createUniqueSlugHook(collection: SupportedCollection, fallbackLabel: string): CollectionBeforeValidateHook {
  return async ({ data, operation, originalDoc, req }) => {
    if (!data) {
      return data
    }

    const baseSlug =
      formatSlug(typeof data.slug === 'string' ? data.slug : '') ||
      formatSlug(typeof data.name === 'string' ? data.name : '') ||
      formatSlug(typeof originalDoc?.name === 'string' ? originalDoc.name : '') ||
      fallbackLabel

    let candidate = baseSlug
    let suffix = 2

    while (true) {
      const existing = await req.payload.find({
        collection,
        depth: 0,
        limit: 1,
        overrideAccess: false,
        pagination: false,
        req,
        where: {
          and: [
            {
              slug: {
                equals: candidate,
              },
            },
            ...(operation === 'update' && originalDoc?.id
              ? [
                  {
                    id: {
                      not_equals: originalDoc.id,
                    },
                  },
                ]
              : []),
          ],
        },
      })

      if (!existing.docs.length) {
        return {
          ...data,
          slug: candidate,
        }
      }

      candidate = `${baseSlug}-${suffix}`
      suffix += 1
    }
  }
}
