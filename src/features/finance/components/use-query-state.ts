"use client"

import { useCallback } from "react"
import { usePathname, useSearchParams } from "next/navigation"
import { useRouteNavigate } from "@/components/route-pending"

/**
 * Updates the URL query (the page re-renders on the server). `undefined`/""
 * removes a key. Changing any filter other than `page` resets to page 1.
 */
export function useQueryState() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { isPending, navigate } = useRouteNavigate()

  const update = useCallback(
    (patch: Record<string, string | number | boolean | undefined | null>, opts: { replace?: boolean } = {}) => {
      const params = new URLSearchParams(searchParams.toString())
      for (const [k, v] of Object.entries(patch)) {
        if (v === undefined || v === null || v === "" || v === false) params.delete(k)
        else params.set(k, String(v))
      }
      if (!("page" in patch)) params.delete("page")
      const qs = params.toString()
      const href = qs ? `${pathname}?${qs}` : pathname
      navigate(href, { replace: opts.replace, scroll: false })
    },
    [navigate, pathname, searchParams]
  )

  return { searchParams, update, isPending }
}
