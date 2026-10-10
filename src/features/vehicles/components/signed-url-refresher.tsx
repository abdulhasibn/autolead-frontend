"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

const MARGIN_MS = 30_000

/**
 * Photo URLs are signed for ~10 minutes. Re-render the page from the server
 * shortly before the earliest one expires, or as soon as the tab regains
 * focus after it has, so images never turn into broken icons.
 */
export function SignedUrlRefresher({ expiresAt }: { expiresAt: string | null }) {
  const router = useRouter()

  useEffect(() => {
    if (!expiresAt) return
    const deadline = new Date(expiresAt).getTime() - MARGIN_MS
    if (Number.isNaN(deadline)) return

    let timer: ReturnType<typeof setTimeout> | undefined
    function schedule() {
      clearTimeout(timer)
      timer = setTimeout(() => {
        if (document.visibilityState === "visible") router.refresh()
      }, Math.max(0, deadline - Date.now()))
    }
    function onVisible() {
      if (document.visibilityState !== "visible") return
      if (Date.now() >= deadline) router.refresh()
      else schedule()
    }

    schedule()
    document.addEventListener("visibilitychange", onVisible)
    return () => {
      clearTimeout(timer)
      document.removeEventListener("visibilitychange", onVisible)
    }
  }, [expiresAt, router])

  return null
}

