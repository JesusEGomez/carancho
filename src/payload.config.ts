import { postgresAdapter } from '@payloadcms/db-postgres'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { vercelBlobStorage } from '@payloadcms/storage-vercel-blob'
import path from 'path'
import { buildConfig } from 'payload'
import { fileURLToPath } from 'url'
import sharp from 'sharp'

import { Users } from './collections/Users'
import { Media } from './collections/Media'
import { Categories } from './collections/Categories'
import { Products } from './collections/Products'
import { StoreContacts } from './collections/StoreContacts'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)
const hasValidBlobToken = process.env.BLOB_READ_WRITE_TOKEN?.startsWith('vercel_blob_rw_')
const isBlobStorageDisabled = process.env.PAYLOAD_DISABLE_BLOB_STORAGE === 'true'
const shouldEnableBlobStorage = hasValidBlobToken && !isBlobStorageDisabled

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
  collections: [Users, Media, Categories, Products, StoreContacts],
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
    ...(shouldEnableBlobStorage
      ? [
          vercelBlobStorage({
            enabled: true,
            collections: {
              media: true,
            },
            clientUploads: true,
            token: process.env.BLOB_READ_WRITE_TOKEN,
          }),
        ]
      : []),
  ],
})
