import { describe, expect, it } from "vitest"
import {
  buildLeadsHref,
  matchesLeadSearch,
  pageToOffset,
  parseLeadsSearchParams,
} from "../search-params"

const VEHICLE_ID = "5f0c6b1e-8a3d-4c2b-9e7f-1a2b3c4d5e6f"

describe("parseLeadsSearchParams", () => {
  it("defaults to page 1 with no filters", () => {
    expect(parseLeadsSearchParams({})).toEqual({
      status: undefined,
      vehicleId: undefined,
      q: undefined,
      page: 1,
    })
  })

  it("keeps valid values", () => {
    expect(
      parseLeadsSearchParams({
        status: "lost",
        vehicleId: VEHICLE_ID,
        q: "  asha ",
        page: "3",
      })
    ).toEqual({ status: "lost", vehicleId: VEHICLE_ID, q: "asha", page: 3 })
  })

  it("drops values the API would reject", () => {
    expect(
      parseLeadsSearchParams({ status: "contacted", vehicleId: "abc", page: "-2" })
    ).toEqual({ status: undefined, vehicleId: undefined, q: undefined, page: 1 })
    expect(parseLeadsSearchParams({ page: "1.5" }).page).toBe(1)
  })

  it("uses the first value of repeated params", () => {
    expect(parseLeadsSearchParams({ status: ["new", "lost"] }).status).toBe("new")
  })
})

describe("buildLeadsHref", () => {
  it("omits defaults", () => {
    expect(buildLeadsHref({ page: 1 })).toBe("/leads")
  })

  it("round-trips through the parser", () => {
    const params = { status: "new" as const, vehicleId: VEHICLE_ID, q: "ravi", page: 2 }
    const href = buildLeadsHref(params)
    const parsed = parseLeadsSearchParams(
      Object.fromEntries(new URL(href, "http://x").searchParams)
    )
    expect(parsed).toEqual(params)
  })
})

describe("pageToOffset", () => {
  it("converts 1-based pages to offsets", () => {
    expect(pageToOffset(1)).toBe(0)
    expect(pageToOffset(3, 20)).toBe(40)
  })
})

describe("matchesLeadSearch", () => {
  const lead = {
    contactFullName: "Asha Menon",
    contactPhone: "+919876543210",
    contactEmail: "asha@example.com",
  }

  it("matches name and email case-insensitively", () => {
    expect(matchesLeadSearch(lead, "menon")).toBe(true)
    expect(matchesLeadSearch(lead, "ASHA@")).toBe(true)
  })

  it("matches phone digits regardless of formatting", () => {
    expect(matchesLeadSearch(lead, "98765 43210")).toBe(true)
    expect(matchesLeadSearch(lead, "12345")).toBe(false)
  })

  it("does not match everything on punctuation-only input", () => {
    expect(matchesLeadSearch(lead, "+")).toBe(false)
  })
})
