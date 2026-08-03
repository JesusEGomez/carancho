import { postgresAdapter } from '@payloadcms/db-postgres'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { s3Storage } from '@payloadcms/storage-s3'
import path from 'path'
import { buildConfig } from 'payload'
import { fileURLToPath } from 'url'
import sharp from 'sharp'

import { Users } from './collections/Users'
import { Media } from './collections/Media'
import { Categories } from './collections/Categories'
import { Products } from './collections/Products'
import { StoreContacts } from './collections/StoreContacts'
import { Orders } from './collections/Orders'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)
const hasR2Credentials = Boolean(
  process.env.R2_BUCKET &&
    process.env.R2_ACCESS_KEY_ID &&
    process.env.R2_SECRET_ACCESS_KEY &&
    process.env.R2_ENDPOINT,
)
const isRemoteStorageDisabled = process.env.PAYLOAD_DISABLE_BLOB_STORAGE === 'true'
const shouldEnableR2 = hasR2Credentials && !isRemoteStorageDisabled

export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
  routes: {
    admin: '/payload-admin',
  },
  collections: [Users, Media, Categories, Products, StoreContacts, Orders],
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || '',
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URL || '',
    },
  }),
  sharp,
  plugins: [
    ...(shouldEnableR2
      ? [
          s3Storage({
            enabled: true,
            collections: {
              media: {
                disablePayloadAccessControl: true,
                generateFileURL: ({ filename, prefix }) =>
                  `${process.env.R2_PUBLIC_URL}/${prefix ? `${prefix}/${filename}` : filename}`,
              },
            },
            bucket: process.env.R2_BUCKET || '',
            config: {
              credentials: {
                accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
                secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
              },
              region: 'auto',
              endpoint: process.env.R2_ENDPOINT,
              forcePathStyle: true,
            },
          }),
        ]
      : []),
  ],
})
