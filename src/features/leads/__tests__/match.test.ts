import { describe, expect, it } from "vitest"
import { matchScoreOutcome } from "../constants"
import { matchChip } from "../match"
import type { MatchableVehicle, MatchBreakdownEntry } from "../types"
import { baseLead } from "./fixtures"

const vehicle: MatchableVehicle = {
  id: "77777777-7777-4777-8777-777777777777",
  showroomId: baseLead.showroomId,
  status: "open",
  makeId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
  makeName: "Hyundai",
  modelId: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
  modelName: "Creta",
  variantId: "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
  variantName: "1.6 SX Diesel",
  year: 2018,
  registrationNumber: "KA01AB1234",
  kmDriven: 57500,
  colour: "Pearl White",
  fuelType: "diesel",
  transmission: "manual",
  bodyTypes: ["suv"],
  numPreviousOwners: 1,
  listedPrice: null,
}

function entry(
  criterion: MatchBreakdownEntry["criterion"],
  outcome: MatchBreakdownEntry["outcome"],
  earned = 0
): MatchBreakdownEntry {
  return { criterion, outcome, weight: 30, earned }
}

describe("matchScoreOutcome", () => {
  it("bands scores at 80 and 60", () => {
    expect(matchScoreOutcome(100)).toBe("match")
    expect(matchScoreOutcome(80)).toBe("match")
    expect(matchScoreOutcome(79)).toBe("partial")
    expect(matchScoreOutcome(60)).toBe("partial")
    expect(matchScoreOutcome(59)).toBe("miss")
  })
})

describe("matchChip", () => {
  it("says an unpriced car can't be checked rather than calling it a miss", () => {
    const chip = matchChip(entry("budget", "unknown"), baseLead, vehicle)
    expect(chip.label).toBe("Budget: car not priced")
    expect(chip.detail).toBe("Budget ₹6,50,000 · car not priced yet")
  })

  it("labels partial catalog matches by what was wanted", () => {
    const wantedVariant = { ...baseLead, preferredVariantId: "dddddddd-dddd-4ddd-8ddd-dddddddddddd" }
    expect(matchChip(entry("catalog", "partial", 20), wantedVariant, vehicle).label).toBe(
      "Model ✓, other variant"
    )
    expect(matchChip(entry("catalog", "partial", 8), wantedVariant, vehicle).label).toBe("Same make")
    const wantedModel = { ...baseLead, preferredModelId: "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee" }
    expect(matchChip(entry("catalog", "partial", 10), wantedModel, vehicle).label).toBe("Same make")
  })

  it("describes partial and missed ranges", () => {
    const lead = { ...baseLead, preferredKmMax: 50000 }
    const chip = matchChip(entry("km", "partial"), lead, vehicle)
    expect(chip.label).toBe("Km a bit over")
    expect(chip.detail).toBe("Wants ≤ 50,000 km · car has 57,500 km")
    expect(matchChip(entry("km", "miss"), lead, vehicle).label).toBe("Km too high")
  })

  it("uses the criterion name for plain matches", () => {
    const lead = { ...baseLead, preferredFuelTypes: ["diesel" as const] }
    const chip = matchChip(entry("fuelType", "match"), lead, vehicle)
    expect(chip.label).toBe("Fuel")
    expect(chip.detail).toBe("Wants Diesel · car is Diesel")
  })
})
