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
})
