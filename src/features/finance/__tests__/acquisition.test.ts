import { describe, expect, it } from "vitest"
import { buildAcquisition, emptyAcquisitionForm, parsePercent, type AcquisitionForm } from "../logic/acquisition"

const TODAY = "2026-11-10"
const form = (over: Partial<AcquisitionForm> = {}): AcquisitionForm => ({ ...emptyAcquisitionForm(TODAY), ...over })

describe("buildAcquisition — commission car", () => {
  it("defaults to 2%", () => {
    expect(buildAcquisition(form(), "commission")).toEqual({
      ok: true,
      payload: { purchaseRate: null, commissionPercent: 2, purchasedOn: TODAY, payment: null },
    })
  })

  it("takes another % and rejects bad ones", () => {
    const ok = buildAcquisition(form({ commissionPercent: "3.5%" }), "commission")
    expect(ok.ok && ok.payload?.commissionPercent).toBe(3.5)
    for (const commissionPercent of ["", "0", "101", "2.345", "abc"]) {
      expect(buildAcquisition(form({ commissionPercent }), "commission").ok).toBe(false)
    }
  })
})

describe("buildAcquisition — bought outright", () => {
  it("saves nothing when left blank", () => {
    expect(buildAcquisition(form(), "purchase")).toEqual({ ok: true, payload: null })
  })

  it("saves the price with nothing paid", () => {
    expect(buildAcquisition(form({ purchaseRate: "5,00,000" }), "purchase")).toEqual({
      ok: true,
      payload: { purchaseRate: 500000, commissionPercent: null, purchasedOn: TODAY, payment: null },
    })
  })

  it("records a full payment at the purchase price", () => {
    const result = buildAcquisition(form({ purchaseRate: "500000", paid: "full", paidOn: "2026-11-09" }), "purchase")
    expect(result.ok && result.payload?.payment).toEqual({ amount: 500000, paidOn: "2026-11-09" })
  })

  it("needs the price to mark it fully paid", () => {
    const result = buildAcquisition(form({ paid: "full" }), "purchase")
    expect(result.ok).toBe(false)
    expect(!result.ok && result.errors.purchaseRate).toBeTruthy()
  })

  it("records a part payment below the price", () => {
    const result = buildAcquisition(form({ purchaseRate: "500000", paid: "part", paidAmount: "1,00,000" }), "purchase")
    expect(result.ok && result.payload?.payment).toEqual({ amount: 100000, paidOn: TODAY })
  })

  it("rejects a part payment that is missing or not below the price", () => {
    expect(buildAcquisition(form({ purchaseRate: "500000", paid: "part", paidAmount: "" }), "purchase").ok).toBe(false)
    expect(buildAcquisition(form({ purchaseRate: "500000", paid: "part", paidAmount: "500000" }), "purchase").ok).toBe(false)
  })

  it("allows a part payment before the price is known", () => {
    const result = buildAcquisition(form({ paid: "part", paidAmount: "50000" }), "purchase")
    expect(result).toEqual({
      ok: true,
      payload: { purchaseRate: null, commissionPercent: null, purchasedOn: null, payment: { amount: 50000, paidOn: TODAY } },
    })
  })
})

describe("parsePercent", () => {
  it("reads plain and % numbers", () => {
    expect(parsePercent(" 2 ")).toBe(2)
    expect(parsePercent("2.5%")).toBe(2.5)
    expect(parsePercent("")).toBeNull()
    expect(parsePercent("-1")).toBeNull()
  })
})
