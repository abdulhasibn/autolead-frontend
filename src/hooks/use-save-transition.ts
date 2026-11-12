"use client"

import { useCallback, useTransition } from "react"
import { useRouter } from "next/navigation"

/**
 * A save that re-fetches the page afterwards, with one pending flag that covers
 * both. Use it in place of `useTransition` + `router.refresh()`.
 *
 * In React 19, updates after an `await` inside `startTransition` are no longer
 * part of the transition, so a bare `router.refresh()` there runs with
 * `isPending` already false: the form closes, the old data shows, and nothing
 * says fresh data is coming. `refresh()` puts the refresh (and any state
 * updates passed to it, like closing the form) back in the transition, so
 * `isPending` stays true and the form closes as the new data appears.
 *
 * ```ts
 * const { isPending, run, refresh } = useSaveTransition()
 * run(async () => {
 *   const result = await saveAction(input)
 *   if (!result.ok) return toast.error(...)
 *   toast.success("Saved.")
 *   refresh(() => setOpen(false))
 * })
 * ```
 */
export function useSaveTransition() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const refresh = useCallback(
    (after?: () => void) => {
      startTransition(() => {
        after?.()
        router.refresh()
      })
    },
    [router]
  )

  return { isPending, run: startTransition, refresh }
}
