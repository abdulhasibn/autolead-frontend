import { describe, expect, it, vi } from "vitest"
import { clearVariantAndDependents } from "../components/catalog-cascade"

describe("clearVariantAndDependents", () => {
  it("clears the variant, fuel and transmission, and nothing else", () => {
    const setValue = vi.fn()
    clearVariantAndDependents(setValue)
    expect(setValue.mock.calls).toEqual([
      ["variantId", ""],
      ["fuelType", ""],
      ["transmission", ""],
    ])
  })
})
