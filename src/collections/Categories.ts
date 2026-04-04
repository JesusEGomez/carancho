import type { CollectionConfig } from 'payload'

import { isAdmin } from '@/access/isAdmin'
import { createUniqueSlugHook } from '@/hooks/createUniqueSlugHook'
import { revalidateCategoryRoutes } from '@/hooks/revalidateStorefront'

export const Categories: CollectionConfig = {
  slug: 'categories',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'slug', 'showInNavigation', 'featured'],
  },
  access: {
    create: isAdmin,
    delete: isAdmin,
    read: () => true,
    update: isAdmin,
  },
  hooks: {
    beforeValidate: [
      createUniqueSlugHook('categories', 'categoria'),
    ],
    afterChange: [
      async () => {
        revalidateCategoryRoutes()
      },
    ],
    afterDelete: [
      async () => {
        revalidateCategoryRoutes()
      },
    ],
    beforeChange: [
      async ({ data, operation, originalDoc, req }) => {
        if (!data) {
          return data
        }

        const nextParent =
          data.parent === undefined
            ? originalDoc?.parent
            : typeof data.parent === 'object' && data.parent
              ? data.parent.id
              : data.parent

        if (!nextParent) {
          return {
            ...data,
            featured: data.featured ?? originalDoc?.featured ?? false,
            showInNavigation: data.showInNavigation ?? originalDoc?.showInNavigation ?? false,
          }
        }

        const selfID = operation === 'update' ? originalDoc?.id : undefined

        if (selfID && Number(nextParent) === Number(selfID)) {
          throw new Error('Una categoría no puede ser su propia categoría padre')
        }

        const parentCategory = await req.payload.findByID({
          collection: 'categories',
          depth: 0,
          id: Number(nextParent),
          overrideAccess: false,
          req,
        })

        if (parentCategory?.parent) {
          throw new Error('Solo se permite un nivel de subcategorías')
        }

        return {
          ...data,
          featured: false,
          showInNavigation: false,
        }
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
      name: 'parent',
      type: 'relationship',
      relationTo: 'categories',
      filterOptions: {
        parent: {
          exists: false,
        },
      },
    },
    {
      name: 'featured',
      type: 'checkbox',
      defaultValue: false,
    },
    {
      name: 'showInNavigation',
      type: 'checkbox',
      defaultValue: false,
    },
    {
      name: 'heroImage',
      type: 'upload',
      relationTo: 'media',
    },
  ],
}
