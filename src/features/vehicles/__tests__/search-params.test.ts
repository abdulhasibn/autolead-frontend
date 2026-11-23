import { describe, expect, it } from "vitest"
import {
  buildVehiclesHref,
  countActiveFilters,
  parseVehiclesSearchParams,
  toListQuery,
} from "../search-params"

describe("vehicles price filter params", () => {
  it("parses priceMin and priceMax as whole rupees", () => {
    const p = parseVehiclesSearchParams({ priceMin: "300000", priceMax: "600000" })
    expect(p.priceMin).toBe(300000)
    expect(p.priceMax).toBe(600000)
  })

  it("drops values the API would reject", () => {
    const p = parseVehiclesSearchParams({ priceMin: "-1", priceMax: "4.5" })
    expect(p.priceMin).toBeUndefined()
    expect(p.priceMax).toBeUndefined()
    expect(parseVehiclesSearchParams({ priceMin: "abc" }).priceMin).toBeUndefined()
  })

  it("swaps an inverted range", () => {
    const p = parseVehiclesSearchParams({ priceMin: "600000", priceMax: "300000" })
    expect([p.priceMin, p.priceMax]).toEqual([300000, 600000])
  })

  it("counts price as one active filter", () => {
    expect(countActiveFilters(parseVehiclesSearchParams({}))).toBe(0)
    expect(countActiveFilters(parseVehiclesSearchParams({ priceMax: "500000" }))).toBe(1)
    expect(countActiveFilters(parseVehiclesSearchParams({ priceMin: "1", priceMax: "2" }))).toBe(1)
  })

  it("round-trips through the href", () => {
    const href = buildVehiclesHref(parseVehiclesSearchParams({ priceMin: "100000", priceMax: "900000" }))
    expect(href).toBe("/vehicles?priceMin=100000&priceMax=900000")
    expect(buildVehiclesHref(parseVehiclesSearchParams({}))).toBe("/vehicles")
  })

  it("sends price to the API list query", () => {
    const q = toListQuery(parseVehiclesSearchParams({ priceMin: "100000" }))
    expect(q.priceMin).toBe(100000)
    expect(q.priceMax).toBeUndefined()
  })
})
