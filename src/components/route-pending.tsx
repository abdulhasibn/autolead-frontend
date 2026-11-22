"use client"

import { createContext, useCallback, useContext, useMemo, useTransition } from "react"
import { useRouter } from "next/navigation"

/**
 * Pages here are Server Components that re-fetch when the query string
 * changes (filters, tabs, period, paging). Next keeps the old page on screen
 * until that fetch finishes and `loading.tsx` doesn't show for same-page query
 * changes, so a click looks ignored. Controls navigate through this shared
 * transition instead, and `<RoutePending>` swaps the page's data area for a
 * skeleton the moment a navigation starts.
 */

type NavigateOptions = { replace?: boolean; scroll?: boolean }

interface RoutePendingValue {
  isPending: boolean
  navigate: (href: string, opts?: NavigateOptions) => void
}

const RoutePendingContext = createContext<RoutePendingValue | null>(null)

export function RoutePendingProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const navigate = useCallback(
    (href: string, { replace = false, scroll = false }: NavigateOptions = {}) => {
      startTransition(() => (replace ? router.replace(href, { scroll }) : router.push(href, { scroll })))
    },
    [router]
  )

  const value = useMemo(() => ({ isPending, navigate }), [isPending, navigate])
  return <RoutePendingContext.Provider value={value}>{children}</RoutePendingContext.Provider>
}

/**
 * Navigate within the current page with instant feedback. Outside the provider
 * (e.g. in unit tests) it falls back to a local transition, as before.
 */
export function useRouteNavigate(): RoutePendingValue {
  const ctx = useContext(RoutePendingContext)
  const router = useRouter()
  const [localPending, startTransition] = useTransition()

  const localNavigate = useCallback(
    (href: string, { replace = false, scroll = false }: NavigateOptions = {}) => {
      startTransition(() => (replace ? router.replace(href, { scroll }) : router.push(href, { scroll })))
    },
    [router]
  )

  return ctx ?? { isPending: localPending, navigate: localNavigate }
}

/** Shows `fallback` instead of `children` while a page navigation is pending. */
export function RoutePending({ children, fallback }: { children: React.ReactNode; fallback: React.ReactNode }) {
  const ctx = useContext(RoutePendingContext)
  return <>{ctx?.isPending ? fallback : children}</>
}
