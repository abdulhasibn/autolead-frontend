"use client"

import { useSyncExternalStore } from "react"

/** Tracks a CSS media query. Server render and first paint assume no match. */
export function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    (onChange) => {
      const mql = window.matchMedia(query)
      mql.addEventListener("change", onChange)
      return () => mql.removeEventListener("change", onChange)
    },
    () => window.matchMedia(query).matches,
    () => false
  )
}

/** Below Tailwind's `md` breakpoint — phones and small tablets. */
export function useIsMobile(): boolean {
  return useMediaQuery("(max-width: 767px)")
}
