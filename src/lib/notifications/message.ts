import { formatCurrency } from '@/lib/formatCurrency'
import type { AdminAlert } from '@/lib/notifications/types'

export type AdminOrderAlertOrder = {
  customerName: string
  id: number
  total: number
}

const NON_BREAKING_SPACE = String.fromCharCode(160)

export function buildAdminOrderAlert(order: AdminOrderAlertOrder, adminPanelUrl: string): AdminAlert {
  const money = formatCurrency(order.total).split(NON_BREAKING_SPACE).join('')

  const message = [
    'Nueva compra confirmada',
    `Pedido #${order.id} - ${order.customerName}`,
    `Total: ${money}`,
    `Ver: ${adminPanelUrl}`,
  ].join('\n')

  return { message, orderId: order.id }
}
