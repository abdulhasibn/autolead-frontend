"use client"

import { useEffect, useLayoutEffect, useRef } from "react"
import { usePathname, useSearchParams } from "next/navigation"

const STORAGE_KEY = "ui.scrollPositions.v1"
/** Give streamed/suspended content this long to grow tall enough to restore into. */
const RESTORE_TIMEOUT_MS = 3000

function load(): Record<string, number> {
  try {
    return JSON.parse(sessionStorage.getItem(STORAGE_KEY) ?? "{}") as Record<string, number>
  } catch {
    return {}
  }
}

function save(positions: Record<string, number>) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(positions))
  } catch {
    // Storage full or blocked: restoration just won't survive a reload.
  }
}

/**
 * Scroll restoration for the app's own scroll container. The browser and the
 * App Router only restore the window, but the shell scrolls inside <main>.
 *
 * - Back/forward: returns to where the user left that URL.
 * - Navigating to a different page: starts at the top.
 * - Search-param-only changes (filters, ?tab=): scroll is left alone.
 */
export function useScrollRestoration(ref: React.RefObject<HTMLElement | null>) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const query = searchParams.toString()
  const key = query ? `${pathname}?${query}` : pathname

  const positions = useRef<Record<string, number> | null>(null)
  const keyRef = useRef(key)
  const pathRef = useRef(pathname)
  const isPop = useRef(false)

  // Snapshot the position at the moment the user leaves, while the old page is
  // still in the DOM: a click (links, router.push buttons) or back/forward.
  useEffect(() => {
    positions.current = load()
    const snapshot = () => {
      const el = ref.current
      if (!el) return
      positions.current ??= load()
      positions.current[keyRef.current] = el.scrollTop
      save(positions.current)
    }
    const onPop = () => {
      snapshot()
      isPop.current = true
    }
    document.addEventListener("click", snapshot, { capture: true })
    window.addEventListener("popstate", onPop)
    return () => {
      document.removeEventListener("click", snapshot, { capture: true })
      window.removeEventListener("popstate", onPop)
    }
  }, [ref])

  // Record the position against the URL it belongs to. The in-memory write is
  // synchronous so a tap right after scrolling can't beat it; storage is debounced.
  useEffect(() => {
    const el = ref.current
    if (!el) return
    let timer: ReturnType<typeof setTimeout> | undefined
    const onScroll = () => {
      positions.current ??= load()
      positions.current[keyRef.current] = el.scrollTop
      clearTimeout(timer)
      timer = setTimeout(() => save(positions.current!), 150)
    }
    el.addEventListener("scroll", onScroll, { passive: true })
    return () => {
      el.removeEventListener("scroll", onScroll)
      clearTimeout(timer)
      if (positions.current) save(positions.current)
    }
  }, [ref])

  // Layout effect: switch keys before the browser fires scroll events for the
  // new page, so the old page's saved position isn't overwritten.
  useLayoutEffect(() => {
    const el = ref.current
    const pathChanged = pathRef.current !== pathname
    const keyChanged = keyRef.current !== key
    keyRef.current = key
    pathRef.current = pathname
    const pop = isPop.current
    isPop.current = false
    if (!el || !keyChanged) return

    if (!pop) {
      if (pathChanged) el.scrollTop = 0
      return
    }

    const target = (positions.current ??= load())[key] ?? 0
    // Content may still be streaming in; keep trying until it's tall enough,
    // and stop as soon as the user takes over.
    const started = performance.now()
    let timer: ReturnType<typeof setTimeout> | undefined
    let cancelled = false
    const cancel = () => {
      cancelled = true
      clearTimeout(timer)
    }
    const attempt = () => {
      if (cancelled) return
      el.scrollTop = target
      const reached = Math.abs(el.scrollTop - target) <= 1
      if (!reached && performance.now() - started < RESTORE_TIMEOUT_MS) {
        timer = setTimeout(attempt, 50)
      }
    }
    attempt()
    el.addEventListener("wheel", cancel, { once: true, passive: true })
    el.addEventListener("touchstart", cancel, { once: true, passive: true })
    return () => {
      cancel()
      el.removeEventListener("wheel", cancel)
      el.removeEventListener("touchstart", cancel)
    }
  }, [key, pathname, ref])
}
