import { describe, expect, it } from "vitest"
import { buyerLeavingWarning, buyerOptions, defaultPaidBy, receivedForSale, refundTargets } from "../logic/buyers"
import { financeErrorMessage } from "../logic/errors"
import type { BuyerRow, RefundOwedRow } from "../types"

const lead = (id: string, name: string | null) => ({ id, name, phone: "9000000000" })
const row = (id: string, name: string, paid: number, refunded = 0): BuyerRow => ({
  lead: lead(id, name),
  paid,
  refunded,
  net: paid - refunded,
})
const A = row("a", "Asha", 50000)
const B = row("b", "Bala", 100000, 20000)

describe("receivedForSale", () => {
  it("uses the chosen lead's own row before the sale", () => {
    expect(receivedForSale([A, B], "b", false, 130000)).toBe(80000)
    expect(receivedForSale([A, B], "a", false, 130000)).toBe(50000)
  })

  it("is zero until a lead is picked or when the lead has paid nothing", () => {
    expect(receivedForSale([A, B], "", false, 130000)).toBe(0)
    expect(receivedForSale([A], "zzz", false, 50000)).toBe(0)
  })

  it("uses the sold lead's row on a sold car, else the car-wide figure", () => {
    expect(receivedForSale([B], "", true, 999)).toBe(80000)
    expect(receivedForSale([], "", true, 12345)).toBe(12345)
  })
})

describe("buyer pickers", () => {
  it("preselects only a single buyer", () => {
    expect(defaultPaidBy([A])).toBe("a")
    expect(defaultPaidBy([A, B])).toBe("")
    expect(defaultPaidBy([])).toBe("")
    expect(buyerOptions([A, B]).map((o) => o.label)).toEqual(["Asha", "Bala"])
  })

  it("offers refunds to buyers holding money and to former buyers owed money, never unassigned", () => {
    const owed: RefundOwedRow[] = [
      { lead: lead("c", "Chitra"), paid: 40000, refunded: 0, owed: 40000 },
      { lead: lead("d", "Dev"), paid: 10000, refunded: 20000, owed: -10000 },
      { lead: null, paid: 5000, refunded: 0, owed: 5000 },
    ]
    expect(refundTargets([A, row("e", "Esha", 0)], owed).map((t) => [t.id, t.owed])).toEqual([
      ["a", 50000],
      ["c", 40000],
    ])
  })
})

describe("buyerLeavingWarning", () => {
  it("says what was received and where it will show", () => {
    expect(buyerLeavingWarning(50000)).toBe("₹50,000 was received from this buyer. It will show in Dues as a refund owed.")
  })

  it("stays quiet when nothing was received", () => {
    expect(buyerLeavingWarning(0)).toBeNull()
    expect(buyerLeavingWarning(-5)).toBeNull()
  })
})

describe("error copy for buyer payments", () => {
  const err = (code: string, details?: Record<string, number>) => ({ code, message: "server", status: 422, details })

  it("explains the new lead and refund errors", () => {
    expect(financeErrorMessage(err("SALE_LEAD_REQUIRED"))).toMatch(/pick who paid/i)
    expect(financeErrorMessage(err("SALE_LEAD_NOT_ON_CAR"))).toMatch(/isn’t a buyer of this car/i)
    expect(financeErrorMessage(err("REFUND_LEAD_REQUIRED"))).toMatch(/pick the buyer/i)
    expect(financeErrorMessage(err("ENTRY_FROM_NEWER_VERSION"))).toMatch(/newer version/i)
  })

  it("says how much can still be refunded", () => {
    expect(financeErrorMessage(err("REFUND_ABOVE_PAID", { paid: 50000, refunded: 0, requested: 60000, refundable: 50000 }))).toContain(
      "₹50,000"
    )
  })

  it("no longer special-cases the removed trim error", () => {
    expect(financeErrorMessage(err("SALE_PAYMENT_TRIMMED_PRICE_NOT_SAVED"))).toBe("server")
  })
})
