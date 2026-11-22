import { describe, expect, it } from "vitest"

import { computeKeyboardInset } from "../use-keyboard-inset"

describe("computeKeyboardInset", () => {
  it("is zero when the keyboard is closed", () => {
    expect(computeKeyboardInset(812, { height: 812, offsetTop: 0 })).toEqual({ bottom: 0, visibleHeight: null })
  })

  it("ignores small differences from the browser's URL bar", () => {
    expect(computeKeyboardInset(812, { height: 760, offsetTop: 0 })).toEqual({ bottom: 0, visibleHeight: null })
  })

  it("lifts the sheet by the keyboard height (iPhone, ~336px keyboard)", () => {
    expect(computeKeyboardInset(812, { height: 476, offsetTop: 0 })).toEqual({ bottom: 336, visibleHeight: 476 })
  })

  it("accounts for the visual viewport being scrolled", () => {
    expect(computeKeyboardInset(812, { height: 476, offsetTop: 100 })).toEqual({ bottom: 236, visibleHeight: 476 })
  })

  // Regression: iOS scrolls the visual viewport all the way down when a field
  // in a bottom sheet is focused. The keyboard is still open, so the sheet must
  // still be capped to the visible height, or its top runs off the screen.
  it("still caps the height when iOS has scrolled the view fully down", () => {
    expect(computeKeyboardInset(812, { height: 476, offsetTop: 336 })).toEqual({ bottom: 0, visibleHeight: 476 })
  })

  it("never goes negative if the view over-scrolls", () => {
    expect(computeKeyboardInset(812, { height: 476, offsetTop: 400 })).toEqual({ bottom: 0, visibleHeight: 476 })
  })
})
