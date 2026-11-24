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
  const sale = (id: string) => ({ id, purpose: "sale", lead: null })
  const refund = (id: string) => ({ id, purpose: "refund", lead: null })

  it("patches only the entries that have no lead, payments before refunds", async () => {
    api.getEntries.mockResolvedValue({
      items: [refund("r1"), { id: "e2", purpose: "sale", lead: { id: "other", name: "Other" } }, sale("e3"), sale("e1")],
      total: 4,
    })
    api.updateEntry.mockResolvedValue({})
    const result = await assignBuyerMoneyAction(CAR, LEAD)
    expect(result).toEqual({ ok: true, data: { assigned: 3, failed: 0, total: 3 } })
    expect(api.updateEntry.mock.calls).toEqual([
      ["e3", { leadId: LEAD }],
      ["e1", { leadId: LEAD }],
      ["r1", { leadId: LEAD }],
    ])
  })

  it("keeps going when one entry fails and says how many were done", async () => {
    api.getEntries.mockResolvedValue({ items: [sale("e1"), sale("e2"), sale("e3")], total: 3 })
    api.updateEntry.mockResolvedValueOnce({}).mockRejectedValueOnce(new Error("boom")).mockResolvedValueOnce({})
    const result = await assignBuyerMoneyAction(CAR, LEAD)
    expect(result).toEqual({ ok: true, data: { assigned: 2, failed: 1, total: 3 } })
    expect(api.updateEntry).toHaveBeenCalledTimes(3)
  })

  it("reads every page of entries (past 100)", async () => {
    const page = (from: number, n: number) => Array.from({ length: n }, (_, i) => sale(`e${from + i}`))
    api.getEntries.mockResolvedValueOnce({ items: page(0, 100), total: 130 }).mockResolvedValueOnce({ items: page(100, 30), total: 130 })
    api.updateEntry.mockResolvedValue({})
    const result = await assignBuyerMoneyAction(CAR, LEAD)
    expect(api.getEntries.mock.calls.map((c) => c[0].offset)).toEqual([0, 100])
    expect(result).toEqual({ ok: true, data: { assigned: 130, failed: 0, total: 130 } })
  })
})
