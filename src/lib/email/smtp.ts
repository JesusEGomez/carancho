const DEFAULT_FROM_NAME = 'Carancho Outdoors'
const DEFAULT_PORT = 587
const IMPLICIT_TLS_PORT = 465

export type SmtpConfig = {
  fromAddress: string
  fromName: string
  host: string
  password: string
  port: number
  secure: boolean
  user: string
}

/**
 * Reads SMTP settings from the environment.
 *
 * Returns null when the transport is not fully configured so callers can skip
 * email entirely instead of registering an adapter that would fail on send.
 */
export function getSmtpConfig(): SmtpConfig | null {
  const host = process.env.SMTP_HOST?.trim()
  const user = process.env.SMTP_USER?.trim()
  const password = process.env.SMTP_PASSWORD?.trim()
  const fromAddress = process.env.SMTP_FROM_ADDRESS?.trim() || user
  const port = Number(process.env.SMTP_PORT?.trim() || DEFAULT_PORT)

  if (!host || !user || !password || !fromAddress || !Number.isInteger(port) || port <= 0) {
    return null
  }

  return {
    fromAddress,
    fromName: process.env.SMTP_FROM_NAME?.trim() || DEFAULT_FROM_NAME,
    host,
    password,
    port,
    // Port 465 speaks TLS from the first byte; every other port negotiates STARTTLS.
    secure: port === IMPLICIT_TLS_PORT,
    user,
  }
}
