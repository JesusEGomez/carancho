import type { CollectionConfig, FieldAccess } from 'payload'

import { isAdmin } from '@/access/isAdmin'
import { isAdminOrSelf } from '@/access/isAdminOrSelf'

const isAdminFieldLevel: FieldAccess = ({ req: { user } }) => user?.role === 'admin'

export const Users: CollectionConfig = {
  slug: 'users',
  admin: {
    useAsTitle: 'name',
  },
  access: {
    // Only admins may enter the Payload admin panel.
    admin: ({ req: { user } }) => user?.role === 'admin',
    // There is no public signup; users are created by admins or seed scripts.
    // Payload's "create first user" screen bypasses this when no users exist.
    create: isAdmin,
    delete: isAdmin,
    read: isAdminOrSelf,
    update: isAdminOrSelf,
  },
  auth: true,
  hooks: {
    beforeChange: [
      // The role field is admin-only, so the unauthenticated "create first user" screen
      // cannot set it. Promote the very first user to admin so a fresh install is usable.
      async ({ data, operation, req }) => {
        if (operation !== 'create') {
          return data
        }

        const { totalDocs } = await req.payload.count({
          collection: 'users',
          overrideAccess: true,
          req,
        })

        return totalDocs === 0 ? { ...data, role: 'admin' } : data
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
      name: 'role',
      type: 'select',
      defaultValue: 'customer',
      required: true,
      saveToJWT: true,
      access: {
        // Prevent privilege escalation: only admins can assign or change roles.
        create: isAdminFieldLevel,
        update: isAdminFieldLevel,
      },
      options: [
        {
          label: 'Admin',
          value: 'admin',
        },
        {
          label: 'Customer',
          value: 'customer',
        },
      ],
    },
  ],
}
