import { describe, expect, it } from "vitest"
import {
  getNextLeadStatuses,
  isLeadClosed,
  isLeadStatus,
  LEAD_STATUSES,
  LEAD_STATUS_BADGE_VARIANTS,
  LEAD_STATUS_LABELS,
} from "../constants"

describe("lead status rules", () => {
  it("has a label and badge variant for every status", () => {
    for (const status of LEAD_STATUSES) {
      expect(LEAD_STATUS_LABELS[status]).toBeTruthy()
      expect(LEAD_STATUS_BADGE_VARIANTS[status]).toBeTruthy()
    }
  })

  it("mirrors the backend transition table", () => {
    expect(getNextLeadStatuses("new")).toEqual(["not_now", "booking_confirmed", "lost"])
    expect(getNextLeadStatuses("booking_confirmed")).toEqual(["converted", "lost"])
    expect(getNextLeadStatuses("vehicle_unavailable")).toEqual([
      "new",
      "not_now",
      "booking_confirmed",
      "lost",
    ])
  })

  it("never offers the system-managed vehicle_unavailable status", () => {
    for (const status of LEAD_STATUSES) {
      expect(getNextLeadStatuses(status)).not.toContain("vehicle_unavailable")
    }
  })

  it("treats converted and lost as closed", () => {
    expect(isLeadClosed("converted")).toBe(true)
    expect(isLeadClosed("lost")).toBe(true)
    expect(isLeadClosed("new")).toBe(false)
  })

  it("narrows unknown values", () => {
    expect(isLeadStatus("not_now")).toBe(true)
    expect(isLeadStatus("contacted")).toBe(false)
    expect(isLeadStatus(undefined)).toBe(false)
  })
})
