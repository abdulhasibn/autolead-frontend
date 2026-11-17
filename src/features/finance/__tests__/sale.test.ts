import { describe, expect, it } from "vitest"
import { buildSale, planBuyerPaymentTrim, type BuyerPaymentEntry, type SaleForm } from "../logic/sale"

const TODAY = "2026-11-12"
const form = (over: Partial<SaleForm> = {}): SaleForm => ({
  price: "6,00,000",
  soldOn: TODAY,
  paid: "none",
  paidAmount: "",
  paidOn: TODAY,
  leadId: "",
  ...over,
})

const LEAD = "11111111-1111-4111-8111-111111111111"

describe("buildSale", () => {
  it("needs the buyer's lead while the car isn't sold", () => {
    expect(buildSale(form(), 0, true)).toEqual({ ok: false, errors: { leadId: "Pick the buyer’s lead" } })
    const result = buildSale(form({ leadId: LEAD }), 0, true)
    expect(result.ok && result.payload.leadId).toBe(LEAD)
  })

  it("sends no lead once the car is sold, even if one was picked", () => {
    const result = buildSale(form({ leadId: LEAD }))
    expect(result.ok && result.payload.leadId).toBeNull()
  })

  it("saves the sale with nothing received", () => {
    expect(buildSale(form())).toEqual({
      ok: true,
      payload: { finalisedPrice: 600000, soldOn: TODAY, leadId: null, payment: null, buyerPayments: null },
    })
  })

  it("records the full price as received", () => {
    const result = buildSale(form({ paid: "full" }))
    expect(result.ok && result.payload.payment).toEqual({ amount: 600000, paidOn: TODAY })
  })

  it("records only the rest when some was already received", () => {
    const result = buildSale(form({ paid: "full" }), 100000)
    expect(result.ok && result.payload.payment).toEqual({ amount: 500000, paidOn: TODAY })
  })

  it("records a part payment and rejects one that covers the price", () => {
    const part = buildSale(form({ paid: "part", paidAmount: "2,00,000" }))
    expect(part.ok && part.payload.payment).toEqual({ amount: 200000, paidOn: TODAY })
    expect(buildSale(form({ paid: "part", paidAmount: "6,00,000" })).ok).toBe(false)
    expect(buildSale(form({ paid: "part", paidAmount: "5,00,000" }), 100000).ok).toBe(false)
    expect(buildSale(form({ paid: "part", paidAmount: "" })).ok).toBe(false)
  })

  it("rejects fully paid when nothing is left to receive", () => {
    expect(buildSale(form({ paid: "full" }), 600000).ok).toBe(false)
  })

  it("needs a price, a sale date and a payment date", () => {
    expect(buildSale(form({ price: "" })).ok).toBe(false)
    expect(buildSale(form({ soldOn: "" })).ok).toBe(false)
    expect(buildSale(form({ paid: "full", paidOn: "" })).ok).toBe(false)
  })
})

describe("planBuyerPaymentTrim (#31)", () => {
  const pay = (id: string, amount: number, entryDate: string, createdAt = `${entryDate}T10:00:00Z`): BuyerPaymentEntry => ({
    id,
    amount,
    entryDate,
    createdAt,
  })

  it("lowers the single sale payment to the new price", () => {
    expect(planBuyerPaymentTrim([pay("a", 500000, "2026-11-01")], 50000)).toEqual({
      update: [{ id: "a", amount: 450000 }],
      remove: [],
    })
  })

  it("cuts the newest payments first and deletes those it empties", () => {
    const entries = [pay("token", 50000, "2026-10-01"), pay("balance", 450000, "2026-11-01"), pay("extra", 30000, "2026-11-05")]
    expect(planBuyerPaymentTrim(entries, 100000)).toEqual({
      update: [{ id: "balance", amount: 380000 }],
      remove: ["extra"],
    })
  })

  it("breaks a same-day tie by when it was recorded", () => {
    const entries = [pay("first", 1000, "2026-11-01", "2026-11-01T09:00:00Z"), pay("second", 1000, "2026-11-01", "2026-11-01T11:00:00Z")]
    expect(planBuyerPaymentTrim(entries, 1000)).toEqual({ update: [], remove: ["second"] })
  })

  it("removes an entry exactly equal to the excess and keeps paise exact", () => {
    expect(planBuyerPaymentTrim([pay("a", 1000.1, "2026-11-01"), pay("b", 0.3, "2026-11-02")], 0.4)).toEqual({
      update: [{ id: "a", amount: 1000 }],
      remove: ["b"],
    })
  })

  it("changes nothing when there is no excess", () => {
    expect(planBuyerPaymentTrim([pay("a", 1000, "2026-11-01")], 0)).toEqual({ update: [], remove: [] })
  })
})
