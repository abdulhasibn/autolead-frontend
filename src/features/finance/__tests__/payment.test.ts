import { describe, expect, it } from "vitest"
import { buildPayment, type PaymentErrors, type PaymentFields } from "../logic/payment"
import { dealSchema } from "../schemas"

const TODAY = "2026-11-12"
const COPY = { amountLabel: "amount paid", alreadyFull: "Already fully paid" }
const run = (fields: Partial<PaymentFields>, due: number | null) => {
  const errors: PaymentErrors = {}
  const payment = buildPayment({ paid: "none", paidAmount: "", paidOn: TODAY, ...fields }, due, errors, COPY)
  return { payment, errors }
}

describe("buildPayment", () => {
  it("records nothing when not paid", () => {
    expect(run({}, 500000)).toEqual({ payment: null, errors: {} })
  })

  it("pays what's still due when fully paid", () => {
    expect(run({ paid: "full" }, 300000).payment).toEqual({ amount: 300000, paidOn: TODAY })
  })

  it("refuses fully paid when nothing is due", () => {
    expect(run({ paid: "full" }, 0).errors.paid).toBe("Already fully paid")
  })

  it("takes a part payment below what's due", () => {
    expect(run({ paid: "part", paidAmount: "1,00,000" }, 500000).payment).toEqual({ amount: 100000, paidOn: TODAY })
    expect(run({ paid: "part", paidAmount: "5,00,000" }, 500000).errors.paidAmount).toBeDefined()
    expect(run({ paid: "part", paidAmount: "" }, 500000).errors.paidAmount).toBe("Enter the amount paid")
  })

  it("needs a date", () => {
    expect(run({ paid: "full", paidOn: "" }, 500000)).toEqual({ payment: null, errors: { paidOn: "Pick the payment date" } })
  })
})

describe("dealSchema payment", () => {
  const terms = { purchaseRate: 500000, commissionPercent: null, purchasedOn: null, ownerExpectedPrice: null, minimumSellingPrice: null, note: null }

  it("defaults to no payment", () => {
    expect(dealSchema.parse(terms).payment).toBeNull()
  })

  it("accepts a seller payment on a purchase car only", () => {
    const payment = { amount: 500000, paidOn: TODAY }
    expect(dealSchema.safeParse({ ...terms, payment }).success).toBe(true)
    expect(dealSchema.safeParse({ ...terms, purchaseRate: null, commissionPercent: 2, payment }).success).toBe(false)
  })
})
