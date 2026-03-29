'use client'

import { api } from '@/lib/client/api'

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

export async function uploadMedia(file: File, alt: string) {
  const body = new FormData()
  body.append('_payload', JSON.stringify({ alt }))
  body.append('file', file)

  const response = await api.post<MediaResponse>('/media', body)
  return resolveMedia(response.data)
}
