import { describe, expect, it } from "vitest"
import { minimumAboveListedWarning, saleBelowMinimumWarning } from "../logic/price-warnings"

describe("minimumAboveListedWarning", () => {
  it("warns when the minimum is above the listed price", () => {
    expect(minimumAboveListedWarning(900000, 485000)).toMatch(/above the listed price/i)
  })

  it("is quiet when the minimum is at or below the listed price", () => {
    expect(minimumAboveListedWarning(485000, 485000)).toBeNull()
    expect(minimumAboveListedWarning(400000, 485000)).toBeNull()
  })

  it("is quiet when either price is missing", () => {
    expect(minimumAboveListedWarning(null, 485000)).toBeNull()
    expect(minimumAboveListedWarning(900000, null)).toBeNull()
    expect(minimumAboveListedWarning(0, 485000)).toBeNull()
  })
})

describe("saleBelowMinimumWarning", () => {
  it("warns, and says saving is still allowed, when the price is under the minimum", () => {
    const text = saleBelowMinimumWarning(450000, 500000)
    expect(text).toMatch(/under the minimum selling price/i)
    expect(text).toMatch(/still save/i)
  })

  it("is quiet at or above the minimum, or with no minimum or price", () => {
    expect(saleBelowMinimumWarning(500000, 500000)).toBeNull()
    expect(saleBelowMinimumWarning(600000, 500000)).toBeNull()
    expect(saleBelowMinimumWarning(450000, null)).toBeNull()
    expect(saleBelowMinimumWarning(null, 500000)).toBeNull()
  })
})
