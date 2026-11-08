import { describe, expect, it } from "vitest"
import journeyFixture from "../__fixtures__/lead-journey.json"
import noJourneyFixture from "../__fixtures__/lead-journey-none.json"
import vehiclesFixture from "../__fixtures__/vehicles.json"
import {
  CHANNEL_LABELS,
  formatChange,
  formatCount,
  formatLakh,
  formatPerDay,
  formatRate,
  formatShare,
  hasAttribution,
  isInsightsTab,
  istDateKey,
  shareOf,
  signalPill,
  SIGNAL_PILLS,
} from "../format"
import type { LeadJourney, Signal, VehicleInsights } from "../types"

const SIGNALS: Signal[] = [
  "hot",
  "seen_not_enquired",
  "low_visibility",
  "ageing_cooling",
  "insufficient_data",
  "normal",
]

describe("insights formatters", () => {
  it("formats rupees in lakh", () => {
    expect(formatLakh(940000)).toBe("₹9.4L")
    expect(formatLakh(890000)).toBe("₹8.9L")
    expect(formatLakh(1240000)).toBe("₹12.4L")
    expect(formatLakh(1500000)).toBe("₹15L")
    expect(formatLakh(85000)).toBe("₹0.85L")
    expect(formatLakh(null)).toBe("—")
  })

  it("formats 0–1 rates with a decimal below 10%", () => {
    expect(formatRate(0.0217)).toBe("2.2%")
    expect(formatRate(0.31)).toBe("31%")
    expect(formatRate(0)).toBe("0%")
    expect(formatRate(null)).toBe("—")
  })

  it("formats 0–100 shares and counts", () => {
    expect(formatShare(31)).toBe("31%")
    expect(formatShare(shareOf(2081, 3412))).toBe("61%")
    expect(shareOf(5, 0)).toBeNull()
    expect(formatCount(3412)).toBe("3,412")
    expect(formatCount(123456)).toBe("1,23,456")
  })

  it("describes the change between two per-day rates", () => {
    expect(formatChange(9, 14.5)).toBe("+61%")
    expect(formatChange(10, 7)).toBe("-30%")
    expect(formatChange(0, 0.13)).toBe("new")
    expect(formatChange(0, 0)).toBe("0%")
    expect(formatPerDay(14.5)).toBe("14.5")
    expect(formatPerDay(9)).toBe("9")
    expect(formatPerDay(0.13)).toBe("0.13")
  })

  it("keys timestamps by IST calendar day", () => {
    expect(istDateKey("2026-10-20T11:15:00+05:30")).toBe("2026-10-20")
    // 20:00 UTC is already the next day in India.
    expect(istDateKey("2026-10-20T20:00:00Z")).toBe("2026-10-21")
  })

  it("only accepts known tabs", () => {
    expect(isInsightsTab("cars")).toBe(true)
    expect(isInsightsTab("sales")).toBe(false)
    expect(isInsightsTab(undefined)).toBe(false)
  })
})

describe("signal pills", () => {
  it("has a distinct label and colour for every signal", () => {
    const labels = new Set(SIGNALS.map((s) => SIGNAL_PILLS[s].label))
    expect(labels.size).toBe(SIGNALS.length)
    for (const s of SIGNALS) expect(SIGNAL_PILLS[s].className).toBeTruthy()
  })

  it("maps signals to the lead-status palette", () => {
    expect(signalPill("hot")).toEqual({ label: "Hot", className: "bg-success-muted text-success" })
    expect(signalPill("seen_not_enquired").className).toContain("warning")
    expect(signalPill("ageing_cooling").className).toContain("destructive")
    expect(signalPill("insufficient_data").label).toBe("Not enough data")
  })

  it("falls back to a neutral pill for a signal the console doesn't know yet", () => {
    expect(signalPill("price_war" as Signal)).toEqual({
      label: "price_war",
      className: "bg-muted text-muted-foreground",
    })
  })

  it("covers every signal and channel used by the fixtures", () => {
    const { items } = vehiclesFixture as VehicleInsights
    for (const row of items) {
      expect(SIGNAL_PILLS[row.signal.code]).toBeDefined()
      if (row.topChannel) expect(CHANNEL_LABELS[row.topChannel]).toBeDefined()
    }
  })
})

describe("hasAttribution", () => {
  it("is true for a website lead and false for a walk-in", () => {
    expect(hasAttribution(journeyFixture as LeadJourney)).toBe(true)
    expect(hasAttribution(noJourneyFixture as LeadJourney)).toBe(false)
    expect(hasAttribution(null)).toBe(false)
  })
})
