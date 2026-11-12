import { describe, expect, it } from "vitest"
import { buildSale, type SaleForm } from "../logic/sale"

const TODAY = "2026-11-12"
const form = (over: Partial<SaleForm> = {}): SaleForm => ({
  price: "6,00,000",
  soldOn: TODAY,
  paid: "none",
  paidAmount: "",
  paidOn: TODAY,
  ...over,
})

describe("buildSale", () => {
  it("saves the sale with nothing received", () => {
    expect(buildSale(form())).toEqual({ ok: true, payload: { finalisedPrice: 600000, soldOn: TODAY, payment: null } })
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
