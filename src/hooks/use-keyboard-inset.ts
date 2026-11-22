"use client"

import { useEffect, useState } from "react"

export interface SheetFrame {
  /** `top` for a `position: fixed` sheet, in layout-viewport pixels. */
  top: number
  height: number
  /** True while an on-screen keyboard is taking up part of the screen. */
  keyboardOpen: boolean
}

/** Below this the difference is browser chrome (URL bar), not a keyboard. */
const MIN_KEYBOARD_PX = 80
/** Space kept free above the sheet so it never touches the screen's top edge. */
const TOP_GAP_PX = 8

/**
 * Pure maths, split out for tests.
 *
 * Places a bottom sheet inside the part of the screen the user can actually
 * see (the visual viewport). The sheet is positioned by `top`, measured from
 * the visual viewport's own offset, so it lands on screen however iOS has
 * scrolled or resized things for the keyboard. It never relies on
 * `window.innerHeight`, which iOS Safari reports inconsistently while the
 * keyboard is open.
 *
 * `fullHeight` is the screen height with no keyboard; the sheet aims for
 * `fraction` of it and shrinks to fit when the keyboard leaves less room.
 */
export function computeSheetFrame(
  fullHeight: number,
  viewport: { height: number; offsetTop: number },
  fraction = 0.8
): SheetFrame {
  const height = Math.round(Math.min(fullHeight * fraction, viewport.height - TOP_GAP_PX))
  const top = Math.round(viewport.offsetTop + viewport.height - height)
  return { top, height, keyboardOpen: fullHeight - viewport.height >= MIN_KEYBOARD_PX }
}

function sameFrame(a: SheetFrame | null, b: SheetFrame) {
  return a != null && a.top === b.top && a.height === b.height && a.keyboardOpen === b.keyboardOpen
}

/**
 * Keeps a bottom sheet inside the visible part of the screen while `active`.
 *
 * Phone browsers keep the layout viewport full height when the keyboard opens,
 * so a sheet pinned with `bottom: 0` ends up under the keyboard, and iOS then
 * scrolls the page to reveal the focused field, which pushes the sheet's top
 * off screen. This follows the visual viewport instead and returns where the
 * sheet should sit. Returns null where `visualViewport` isn't supported.
 */
export function useVisualViewportSheet(active: boolean, fraction = 0.8): SheetFrame | null {
  const [frame, setFrame] = useState<SheetFrame | null>(null)

  useEffect(() => {
    const vv = typeof window === "undefined" ? undefined : window.visualViewport
    if (!active || !vv) return
    // Screen height without a keyboard: the largest visible height seen while
    // open, starting from the layout viewport (which the keyboard doesn't change).
    let fullHeight = Math.max(document.documentElement.clientHeight, vv.height)
    const update = () => {
      fullHeight = Math.max(fullHeight, vv.height)
      const next = computeSheetFrame(fullHeight, vv, fraction)
      setFrame((prev) => (sameFrame(prev, next) ? prev : next))
    }
    update()
    vv.addEventListener("resize", update)
    vv.addEventListener("scroll", update)
    return () => {
      vv.removeEventListener("resize", update)
      vv.removeEventListener("scroll", update)
      setFrame(null)
    }
  }, [active, fraction])

  return frame
}
