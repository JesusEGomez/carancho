import type { CollectionConfig } from 'payload'

import { isAdmin } from '@/access/isAdmin'
import { createUniqueSlugHook } from '@/hooks/createUniqueSlugHook'
import { revalidateProductRoutes } from '@/hooks/revalidateStorefront'
import { publishedOrAdmin } from '@/access/publishedOrAdmin'

export const Products: CollectionConfig = {
  slug: 'products',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'status', 'price', 'stock', 'category'],
  },
  access: {
    create: isAdmin,
    delete: isAdmin,
    read: publishedOrAdmin,
    update: isAdmin,
  },
  hooks: {
    beforeValidate: [
      createUniqueSlugHook('products', 'producto'),
    ],
    afterChange: [
      async ({ doc, previousDoc }) => {
        revalidateProductRoutes([doc?.slug, previousDoc?.slug])
      },
    ],
    afterDelete: [
      async ({ doc }) => {
        revalidateProductRoutes([doc?.slug])
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
      name: 'category',
      type: 'relationship',
      relationTo: 'categories',
      required: true,
    },
    {
      name: 'status',
      type: 'select',
      defaultValue: 'published',
      required: true,
      options: [
        {
          label: 'Published',
          value: 'published',
        },
        {
          label: 'Draft',
          value: 'draft',
        },
      ],
    },
    {
      name: 'shortDescription',
      type: 'textarea',
      required: true,
    },
    {
      name: 'description',
      type: 'textarea',
      required: true,
    },
    {
      name: 'price',
      type: 'number',
      required: true,
      min: 0,
    },
    {
      name: 'compareAtPrice',
      type: 'number',
      min: 0,
    },
    {
      name: 'stock',
      type: 'number',
      required: true,
      defaultValue: 0,
      min: 0,
    },
    {
      name: 'isFeatured',
      type: 'checkbox',
      defaultValue: false,
    },
    {
      name: 'badges',
      type: 'select',
      hasMany: true,
      options: [
        {
          label: 'Nuevo',
          value: 'nuevo',
        },
        {
          label: 'Oferta',
          value: 'oferta',
        },
        {
          label: 'Destacado',
          value: 'destacado',
        },
      ],
    },
    {
      name: 'featuredImage',
      type: 'upload',
      relationTo: 'media',
      required: true,
    },
    {
      name: 'gallery',
      type: 'upload',
      relationTo: 'media',
      hasMany: true,
    },
    {
      name: 'showFeatures',
      type: 'checkbox',
      defaultValue: false,
    },
    {
      name: 'features',
      type: 'array',
      fields: [
        {
          name: 'label',
          type: 'text',
          required: true,
        },
      ],
    },
    {
      name: 'showSpecifications',
      type: 'checkbox',
      defaultValue: false,
    },
    {
      name: 'specifications',
      type: 'array',
      fields: [
        {
          name: 'label',
          type: 'text',
          required: true,
        },
        {
          name: 'value',
          type: 'text',
          required: true,
        },
      ],
    },
  ],
}
