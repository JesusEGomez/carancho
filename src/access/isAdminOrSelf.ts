import type { Access } from 'payload'

/**
 * Grants full access to admins and restricts everyone else to their own
 * user document. Unauthenticated requests are denied.
 */
export const isAdminOrSelf: Access = ({ req: { user } }) => {
  if (!user) {
    return false
  }

  if (user.role === 'admin') {
    return true
  }

  return {
    id: {
      equals: user.id,
    },
  }
}
