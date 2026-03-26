import type { Access } from 'payload'

export const publishedOrAdmin: Access = ({ req: { user } }) => {
  if (user?.role === 'admin') {
    return true
  }

  return {
    status: {
      equals: 'published',
    },
  }
}

