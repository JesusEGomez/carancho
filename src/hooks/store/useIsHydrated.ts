'use client'

import { useSyncExternalStore } from 'react'

function subscribe() {
  return () => {}
}

/**
 * Returns false while React hydrates server HTML and true afterwards.
 *
 * Use it to defer client-only values (such as a cart read from localStorage) so the
 * hydration render matches the server. This also holds inside Suspense boundaries,
 * which hydrate after their parents' state may already have changed.
 */
export function useIsHydrated() {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  )
}
