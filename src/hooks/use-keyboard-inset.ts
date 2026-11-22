"use client"

import { useEffect, useState } from "react"

export interface KeyboardInset {
  /** Pixels the on-screen keyboard covers at the bottom of the layout viewport. */
  bottom: number
  /** Height of the part of the screen the user can actually see. */
  visibleHeight: number | null
}

const NONE: KeyboardInset = { bottom: 0, visibleHeight: null }

/** Below this the difference is browser chrome (URL bar), not a keyboard. */
const MIN_KEYBOARD_PX = 80

/**
 * Pure maths, split out for tests.
 *
 * The keyboard is detected from how much shorter the visible area is than the
 * layout viewport. Where the visible area sits is a separate question: iOS
 * also scrolls the visual viewport down (offsetTop) to keep the focused field
 * in view, so the visible bottom can be anywhere from the keyboard's top edge
 * to the layout bottom. `bottom` lines the sheet up with that visible bottom
 * and `visibleHeight` caps its height, so the whole sheet (title, search box,
 * results) stays on screen however Safari has scrolled.
 */
export function computeKeyboardInset(
  layoutHeight: number,
  viewport: { height: number; offsetTop: number }
): KeyboardInset {
  if (layoutHeight - viewport.height < MIN_KEYBOARD_PX) return NONE
  const bottom = Math.max(0, Math.round(layoutHeight - viewport.height - viewport.offsetTop))
  return { bottom, visibleHeight: Math.round(viewport.height) }
}

/**
 * Tracks how much of the screen the on-screen keyboard covers while `active`.
 *
 * iOS Safari and Android Chrome keep the layout viewport full height when the
 * keyboard opens, so anything pinned with `bottom: 0` ends up under the
 * keyboard. Bottom sheets use this to sit on top of it instead.
 */
export function useKeyboardInset(active: boolean): KeyboardInset {
  const [inset, setInset] = useState<KeyboardInset>(NONE)

  useEffect(() => {
    const vv = typeof window === "undefined" ? undefined : window.visualViewport
    if (!active || !vv) return
    const update = () => {
      const next = computeKeyboardInset(window.innerHeight, vv)
      setInset((prev) =>
        prev.bottom === next.bottom && prev.visibleHeight === next.visibleHeight ? prev : next
      )
    }
    update()
    vv.addEventListener("resize", update)
    vv.addEventListener("scroll", update)
    return () => {
      vv.removeEventListener("resize", update)
      vv.removeEventListener("scroll", update)
      setInset(NONE)
    }
  }, [active])

  return inset
}
