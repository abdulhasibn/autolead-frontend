import { describe, expect, it } from "vitest"
import { presetRange, todayIST, validateRange, rangeLimitFor } from "../logic/dates"
import { parseEntrySearchParams, toEntryQuery } from "../search-params"

describe("business dates", () => {
  it("uses Asia/Kolkata for today, not UTC", () => {
    // 20:00 UTC on 31 Oct is already 1 Nov in India.
    expect(todayIST(new Date("2026-10-31T20:00:00Z"))).toBe("2026-11-01")
    expect(todayIST(new Date("2026-10-31T18:00:00Z"))).toBe("2026-10-31")
  })

  it("builds presets from a YYYY-MM-DD today", () => {
    expect(presetRange("this-month", "2026-11-08")).toEqual({ from: "2026-11-01", to: "2026-11-08" })
    expect(presetRange("last-month", "2026-11-08")).toEqual({ from: "2026-10-01", to: "2026-10-31" })
    expect(presetRange("this-fy", "2026-02-10")).toEqual({ from: "2025-04-01", to: "2026-02-10" })
  })

  it("limits day/week to 366 days and month/year to 5 years", () => {
    expect(validateRange({ from: "2025-01-01", to: "2026-01-01" }, rangeLimitFor("day"))).toBeNull()
    expect(validateRange({ from: "2025-01-01", to: "2026-01-03" }, rangeLimitFor("week"))).not.toBeNull()
    expect(validateRange({ from: "2022-01-01", to: "2026-01-03" }, rangeLimitFor("month"))).toBeNull()
    expect(validateRange({ from: "2026-02-01", to: "2026-01-01" }, 366)).toMatch(/before/)
  })
})

describe("ledger search params", () => {
  it("defaults to this month and needs dates without a car", () => {
    const f = parseEntrySearchParams({}, "2026-11-08")
    expect(toEntryQuery(f)).toMatchObject({ from: "2026-11-01", to: "2026-11-08", sort: "date", offset: 0 })
  })

  it("drops dates when a car is selected", () => {
    const id = "6f1c9a2e-1111-4a6b-9c3d-123456789abc"
    const q = toEntryQuery(parseEntrySearchParams({ vehicleId: id, unlinked: "true" }, "2026-11-08"))
    expect(q.vehicleId).toBe(id)
    expect(q.from).toBeUndefined()
    expect(q.unlinked).toBeUndefined()
  })

  it("flags ranges over 366 days before calling the API", () => {
    expect(parseEntrySearchParams({ from: "2025-01-01", to: "2026-06-01" }, "2026-11-08").rangeError).toMatch(/366/)
  })
})
