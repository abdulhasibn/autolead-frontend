import { beforeEach, describe, expect, it, vi } from "vitest"

const api = {
  removeSale: vi.fn(),
  recordSale: vi.fn(),
  getCarMoneySoft: vi.fn(),
  getEntries: vi.fn(),
  updateEntry: vi.fn(),
  deleteEntry: vi.fn(),
}
let roles: string[] = ["admin"]
let hasSession = true

vi.mock("../api", () => api)
vi.mock("@/lib/auth", () => ({ auth: async () => ({ user: { roles } }) }))
vi.mock("@/lib/api-client.server", () => ({ serverApiClient: {} }))
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }))
vi.mock("next/navigation", () => ({ unstable_rethrow: (e: unknown) => {
    if (e && typeof e === "object" && "digest" in e) throw e
  } }))
vi.mock("../session", () => ({
  clearFinanceSession: vi.fn(),
  setFinanceSession: vi.fn(),
  hasFinanceSession: async () => hasSession,
}))

const { removeSaleAction, recordSaleAction, getBuyerMoneyAction, assignBuyerMoneyAction } = await import("../actions")

const CAR = "11111111-1111-4111-8111-111111111111"
const LEAD = "22222222-2222-4222-8222-222222222222"

beforeEach(() => {
  vi.clearAllMocks()
  roles = ["admin"]
  hasSession = true
})

describe("remove sale", () => {
  it("makes one server call that also deletes the sold lead's payments, with no client-side deletes", async () => {
    api.removeSale.mockResolvedValue(undefined)
    const result = await removeSaleAction(CAR)
    expect(result.ok).toBe(true)
    expect(api.removeSale).toHaveBeenCalledWith(CAR, { withBuyerPayments: true })
    expect(api.getEntries).not.toHaveBeenCalled()
    expect(api.deleteEntry).not.toHaveBeenCalled()
  })
})

describe("record sale: Entered wrong, reduce", () => {
  const payload = { finalisedPrice: 500000, soldOn: "2026-11-24", leadId: LEAD, payment: null }

  it("asks the server to adjust and does not trim entries itself", async () => {
    api.recordSale.mockResolvedValue({})
    const result = await recordSaleAction(CAR, { ...payload, buyerPayments: "adjust" })
    expect(result.ok).toBe(true)
    expect(api.recordSale).toHaveBeenCalledWith(
      CAR,
      expect.objectContaining({ buyerPayments: "adjust", keepOverpayment: false, leadId: LEAD })
    )
    expect(api.getEntries).not.toHaveBeenCalled()
    expect(api.updateEntry).not.toHaveBeenCalled()
    expect(api.deleteEntry).not.toHaveBeenCalled()
  })

  it("keeping the overpayment sends keepOverpayment, not adjust", async () => {
    api.recordSale.mockResolvedValue({})
    await recordSaleAction(CAR, { ...payload, buyerPayments: "keep" })
    const body = api.recordSale.mock.calls[0]?.[1]
    expect(body.keepOverpayment).toBe(true)
    expect(body).not.toHaveProperty("buyerPayments")
  })
})

describe("buyer-leaving lookup", () => {
  const money = { buyers: [{ lead: { id: LEAD }, net: 50000 }, { lead: { id: "x" }, net: -1 }] }

  it("returns what the buyers paid for an admin with finance unlocked", async () => {
    api.getCarMoneySoft.mockResolvedValue(money)
    const result = await getBuyerMoneyAction(CAR)
    expect(result).toEqual({ ok: true, data: { buyers: [{ leadId: LEAD, net: 50000 }, { leadId: "x", net: -1 }], total: 50000 } })
  })

  it("returns nothing when finance is locked", async () => {
    api.getCarMoneySoft.mockResolvedValue(null)
    expect(await getBuyerMoneyAction(CAR)).toEqual({ ok: true, data: null })
  })

  it("does not call finance without a finance session or for a non-admin", async () => {
    hasSession = false
    expect(await getBuyerMoneyAction(CAR)).toEqual({ ok: true, data: null })
    hasSession = true
    roles = ["salesperson"]
    expect(await getBuyerMoneyAction(CAR)).toEqual({ ok: true, data: null })
    expect(api.getCarMoneySoft).not.toHaveBeenCalled()
  })

  it("never throws: an API error just means no warning", async () => {
    api.getCarMoneySoft.mockRejectedValue(new Error("boom"))
    expect(await getBuyerMoneyAction(CAR)).toEqual({ ok: true, data: null })
  })
})

describe("assign unassigned buyer money", () => {
  it("patches only the entries that have no lead", async () => {
    api.getEntries.mockResolvedValue({
      items: [
        { id: "e1", lead: null },
        { id: "e2", lead: { id: "other", name: "Other" } },
        { id: "e3", lead: null },
      ],
      total: 3,
    })
    api.updateEntry.mockResolvedValue({})
    const result = await assignBuyerMoneyAction(CAR, LEAD)
    expect(result).toEqual({ ok: true, data: { assigned: 2 } })
    expect(api.updateEntry.mock.calls).toEqual([
      ["e1", { leadId: LEAD }],
      ["e3", { leadId: LEAD }],
    ])
  })
})
