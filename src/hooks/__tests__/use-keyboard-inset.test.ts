import { describe, expect, it } from "vitest"

import { computeSheetFrame } from "../use-keyboard-inset"

describe("computeSheetFrame", () => {
  it("sits at the bottom at 80% height with no keyboard", () => {
    expect(computeSheetFrame(812, { height: 812, offsetTop: 0 })).toEqual({
      top: 162,
      height: 650,
      keyboardOpen: false,
    })
  })

  it("treats a small difference (URL bar) as no keyboard", () => {
    expect(computeSheetFrame(812, { height: 760, offsetTop: 0 }).keyboardOpen).toBe(false)
  })

  it("sits right above the keyboard when the view isn't scrolled", () => {
    // 336px keyboard: visible area is 0..476.
    expect(computeSheetFrame(812, { height: 476, offsetTop: 0 })).toEqual({
      top: 8,
      height: 468,
      keyboardOpen: true,
    })
  })

  // Regression (real iPhone): iOS scrolls the visual viewport down to reveal
  // the focused search box. The sheet must follow it, top edge on screen.
  it("follows the visual viewport when iOS scrolls it down", () => {
    const frame = computeSheetFrame(812, { height: 476, offsetTop: 336 })
    expect(frame).toEqual({ top: 344, height: 468, keyboardOpen: true })
    expect(frame.top).toBeGreaterThanOrEqual(336)
    expect(frame.top + frame.height).toBeLessThanOrEqual(336 + 476)
  })

  it("stays inside the visible area for any scroll position", () => {
    for (const offsetTop of [0, 50, 120, 336, 500]) {
      const frame = computeSheetFrame(812, { height: 476, offsetTop })
      expect(frame.top).toBeGreaterThanOrEqual(offsetTop)
      expect(frame.top + frame.height).toBe(offsetTop + 476)
    }
  })
})
