import { describe, expect, it } from "vitest"
import { dealSchema } from "../schemas"

const base = { purchasedOn: null, ownerExpectedPrice: null, minimumSellingPrice: null, note: null }

describe("dealSchema", () => {
  it("takes a purchase rate or a commission %, not both or neither", () => {
    expect(dealSchema.safeParse({ ...base, purchaseRate: 500000, commissionPercent: null }).success).toBe(true)
    expect(dealSchema.safeParse({ ...base, purchaseRate: null, commissionPercent: 3.5 }).success).toBe(true)
    expect(dealSchema.safeParse({ ...base, purchaseRate: 500000, commissionPercent: 3.5 }).success).toBe(false)
    expect(dealSchema.safeParse({ ...base, purchaseRate: null, commissionPercent: null }).success).toBe(false)
  })

  it.each([0, -1, 100.5, 2.345])("rejects a commission of %s%%", (commissionPercent) => {
    expect(dealSchema.safeParse({ ...base, purchaseRate: null, commissionPercent }).success).toBe(false)
  })
})
