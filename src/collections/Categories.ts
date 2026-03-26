import type { CollectionConfig } from 'payload'

import { isAdmin } from '@/access/isAdmin'
import { formatSlug } from '@/lib/formatSlug'

export const Categories: CollectionConfig = {
  slug: 'categories',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'slug', 'featured', 'order'],
  },
  access: {
    create: isAdmin,
    delete: isAdmin,
    read: () => true,
    update: isAdmin,
  },
  hooks: {
    beforeValidate: [
      ({ data }) => {
        if (!data) {
          return data
        }

        if (typeof data.name === 'string' && !data.slug) {
          return {
            ...data,
            slug: formatSlug(data.name),
          }
        }

        if (typeof data.slug === 'string') {
          return {
            ...data,
            slug: formatSlug(data.slug),
          }
        }

        return data
      },
    ],
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
    },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      index: true,
    },
    {
      name: 'description',
      type: 'textarea',
    },
    {
      name: 'featured',
      type: 'checkbox',
      defaultValue: false,
    },
    {
      name: 'order',
      type: 'number',
      defaultValue: 0,
    },
    {
      name: 'heroImage',
      type: 'upload',
      relationTo: 'media',
    },
  ],
}

