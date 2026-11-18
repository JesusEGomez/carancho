export type AdminAlert = {
  message: string
  orderId: number
  subject?: string
}

export type AlertResult = {
  delivered: boolean
  reason?: string
}

export interface AdminNotifier {
  notify(alert: AdminAlert): Promise<AlertResult>
}
