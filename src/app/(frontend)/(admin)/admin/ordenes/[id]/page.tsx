import { AdminOrderDetailClient } from '@/components/admin/AdminOrderDetailClient'

type Props = {
  params: Promise<{
    id: string
  }>
}

export default async function AdminOrderDetailPage({ params }: Props) {
  const { id } = await params

  return <AdminOrderDetailClient id={id} />
}
