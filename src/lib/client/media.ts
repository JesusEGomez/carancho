'use client'

import { upload as uploadToVercelBlob } from '@vercel/blob/client'

import { api } from '@/lib/client/api'

const VERCEL_BLOB_CLIENT_UPLOAD_ROUTE = '/api/vercel-blob-client-upload-route'

type MediaRecord = {
  id: number
  url?: string | null
  alt: string
}

type MediaResponse =
  | MediaRecord
  | {
      doc?: MediaRecord
    }

function resolveMedia(data: MediaResponse) {
  const media = 'doc' in data && data.doc ? data.doc : data

  if (!media || typeof media !== 'object' || !('id' in media) || !media.id) {
    throw new Error('La respuesta de media no incluyó un id válido')
  }

  return media
}

async function createMediaDocument(body: FormData) {
  const response = await api.post<MediaResponse>('/media', body)
  return resolveMedia(response.data)
}

async function uploadViaBlob(file: File, alt: string) {
  const blob = await uploadToVercelBlob(file.name, file, {
    access: 'public',
    clientPayload: 'media',
    contentType: file.type,
    handleUploadUrl: VERCEL_BLOB_CLIENT_UPLOAD_ROUTE,
  })

  const pathnameSegments = blob.pathname.split('/').filter(Boolean)
  const filename = pathnameSegments[pathnameSegments.length - 1] ?? file.name
  const prefix = pathnameSegments.slice(0, -1).join('/')
  const body = new FormData()

  body.append('_payload', JSON.stringify({ alt }))
  body.append(
    'file',
    JSON.stringify({
      clientUploadContext: {
        prefix,
      },
      collectionSlug: 'media',
      filename,
      mimeType: file.type,
      size: file.size,
    }),
  )

  return createMediaDocument(body)
}

async function uploadViaPayload(file: File, alt: string) {
  const body = new FormData()
  body.append('_payload', JSON.stringify({ alt }))
  body.append('file', file)

  return createMediaDocument(body)
}

export async function uploadMedia(file: File, alt: string) {
  const isProduction = process.env.NODE_ENV === 'production'

  try {
    return await uploadViaBlob(file, alt)
  } catch (error) {
    if (isProduction) {
      throw error
    }

    return uploadViaPayload(file, alt)
  }
}
