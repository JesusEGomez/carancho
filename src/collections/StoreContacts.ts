import type { CollectionConfig } from 'payload'

import { isAdmin } from '@/access/isAdmin'

export const StoreContacts: CollectionConfig = {
  slug: 'store-contacts',
  admin: {
    useAsTitle: 'title',
  },
  access: {
    create: isAdmin,
    delete: isAdmin,
    read: () => true,
    update: isAdmin,
  },
  hooks: {
    beforeChange: [
      async ({ operation, req }) => {
        if (operation !== 'create') {
          return
        }

        const existingContacts = await req.payload.find({
          collection: 'store-contacts',
          depth: 0,
          limit: 1,
          overrideAccess: false,
          req,
        })

        if (existingContacts.totalDocs > 0) {
          throw new Error('Solo se permite un registro de contacto de tienda')
        }
      },
    ],
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      admin: {
        readOnly: true,
      },
      defaultValue: 'Contacto principal',
      required: true,
    },
    {
      name: 'address',
      type: 'text',
    },
    {
      name: 'phone',
      type: 'text',
    },
    {
      name: 'email',
      type: 'email',
    },
  ],
}
