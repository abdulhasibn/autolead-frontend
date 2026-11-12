"use client"

import { usePathname, useSearchParams } from "next/navigation"

/**
 * Returns a builder for links that set one search param on the current URL and
 * keep every other param, e.g. switching a tab without losing the period.
 */
export function useParamHref(key: string) {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  return (value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set(key, value)
    return `${pathname}?${params.toString()}`
  }
}
