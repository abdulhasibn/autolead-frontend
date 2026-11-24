import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"
import type { VehicleMoneySummary } from "../types"

const setDealAction = vi.fn()
const createEntryAction = vi.fn()
let summary: VehicleMoneySummary | null = null

vi.mock("../actions", () => ({
  setDealAction: (...a: unknown[]) => setDealAction(...a),
  createEntryAction: (...a: unknown[]) => createEntryAction(...a),
  updateEntryAction: vi.fn(),
  payOwnerAction: vi.fn(),
}))
vi.mock("../use-vehicle-money", () => ({
  useVehicleMoney: (ids: string[], enabled: boolean) =>
    enabled && summary && ids[0] ? new Map([[ids[0], summary]]) : null,
}))
// A native select stands in for the custom one so the test can pick a purpose.
vi.mock("@/components/option-select", () => ({
  OptionSelect: (p: { id?: string; value: string; onValueChange: (v: string) => void; options: { value: string; label: string }[] }) => (
    <select id={p.id} aria-label={p.id} value={p.value} onChange={(e) => p.onValueChange(e.target.value)}>
      {p.options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  ),
}))
vi.mock("next/navigation", () => ({ useRouter: () => ({ replace: vi.fn(), refresh: vi.fn(), push: vi.fn() }) }))
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

import { EntrySheet } from "../components/entry-sheet"
import { DealCard } from "../components/vehicle-money/deal-card"
import { sellerPaymentLine, sellerStatusLabel, termsMissing } from "../logic/seller-payment"
import { dealSchema, entrySchema } from "../schemas"

const CAR = { id: "11111111-1111-4111-8111-111111111111", label: "Maruti Swift · KA01AB1234" }

const purchaseSummary = (over: Partial<VehicleMoneySummary> = {}): VehicleMoneySummary => ({
  vehicleId: CAR.id,
  saleModel: "purchase",
  purchaseRate: null,
  commissionPercent: null,
  landingCost: 0,
  currentQuote: null,
  finalisedPrice: null,
  profit: null,
  owedToSeller: null,
  owedByBuyer: null,
  ...over,
})

beforeEach(() => {
  vi.clearAllMocks()
  summary = null
})

describe("seller payment logic", () => {
  it("knows when the deal terms are missing for the sale model", () => {
    expect(termsMissing(purchaseSummary())).toBe(true)
    expect(termsMissing(purchaseSummary({ purchaseRate: 880000 }))).toBe(false)
    expect(termsMissing(purchaseSummary({ saleModel: "commission", purchaseRate: 880000 }))).toBe(true)
  })

  it("summarises rate, paid and owed for the entry form", () => {
    expect(sellerPaymentLine(purchaseSummary({ purchaseRate: 880000, owedToSeller: 580000 }))).toBe(
      "Rate ₹8,80,000 · paid ₹3,00,000 · ₹5,80,000 still owed."
    )
    expect(sellerPaymentLine(purchaseSummary({ purchaseRate: 880000, owedToSeller: 0 }))).toMatch(/fully paid/)
    expect(sellerPaymentLine(purchaseSummary())).toBeNull()
  })

  it("labels the paid status, and nothing without terms", () => {
    expect(sellerStatusLabel({ sellerPaymentStatus: "part" })).toBe("Part paid")
    expect(sellerStatusLabel({ sellerPaymentStatus: "no_terms" })).toBeNull()
  })

  it("sends deal terms with an entry and keepOverpayment with a deal", () => {
    const entry = entrySchema.parse({
      kind: "expense",
      amount: 880000,
      entryDate: "2026-11-22",
      tagIds: [],
      vehicleId: CAR.id,
      purpose: "purchase",
      party: null,
      note: null,
      showroomId: null,
      deal: { purchaseRate: 880000, commissionPercent: null, purchasedOn: "2026-11-20" },
    })
    expect(entry.deal?.purchaseRate).toBe(880000)
    const deal = dealSchema.parse({
      purchaseRate: 880000,
      commissionPercent: null,
      purchasedOn: null,
      ownerExpectedPrice: null,
      minimumSellingPrice: null,
    })
    expect(deal.keepOverpayment).toBe(false)
  })
})

describe("expense form: payment to the seller", () => {
  const renderSheet = () =>
    render(
      <EntrySheet open onOpenChange={() => {}} tags={[]} showrooms={[]} defaultKind="expense" defaultVehicle={CAR} lockVehicle />
    )

  it("asks for the purchase rate when the car has no deal, and saves both together", async () => {
    summary = purchaseSummary()
    createEntryAction.mockResolvedValue({ ok: true, data: {} })
    const user = userEvent.setup()
    renderSheet()

    expect(screen.queryByRole("group", { name: "Deal with the seller" })).not.toBeInTheDocument()
    await user.selectOptions(screen.getByLabelText("entry-purpose"), "purchase")
    expect(screen.getByRole("group", { name: "Deal with the seller" })).toBeInTheDocument()

    await user.type(screen.getByLabelText("Amount"), "880000")
    await user.click(screen.getByRole("button", { name: "Add" }))
    expect(await screen.findByText("Enter the purchase rate agreed with the seller")).toBeInTheDocument()
    expect(createEntryAction).not.toHaveBeenCalled()

    await user.type(screen.getByLabelText("Purchase rate"), "880000")
    await user.click(screen.getByRole("button", { name: "Add" }))
    await waitFor(() => expect(createEntryAction).toHaveBeenCalledTimes(1))
    expect(createEntryAction.mock.calls[0]?.[0]).toMatchObject({
      purpose: "purchase",
      amount: 880000,
      deal: { purchaseRate: 880000, commissionPercent: null },
    })
  })

  it("shows what is owed instead when the car has a deal, prefilling the amount", async () => {
    summary = purchaseSummary({ purchaseRate: 880000, owedToSeller: 580000 })
    const user = userEvent.setup()
    renderSheet()
    await user.selectOptions(screen.getByLabelText("entry-purpose"), "purchase")

    expect(screen.queryByRole("group", { name: "Deal with the seller" })).not.toBeInTheDocument()
    expect(screen.getByText(/₹5,80,000 still owed/)).toBeInTheDocument()
    expect(screen.getByLabelText("Amount")).toHaveValue("5,80,000")
  })

  it("asks before saving a payment above the rate, then keeps the overpayment", async () => {
    summary = purchaseSummary({ purchaseRate: 880000, owedToSeller: 0 })
    createEntryAction
      .mockResolvedValueOnce({
        ok: false,
        error: { status: 422, code: "SELLER_PAID_ABOVE_RATE", message: "x", details: { paidToSeller: 890000, owedLimit: 880000, overpaidBy: 10000 } },
      })
      .mockResolvedValueOnce({ ok: true, data: {} })
    const user = userEvent.setup()
    renderSheet()
    await user.selectOptions(screen.getByLabelText("entry-purpose"), "purchase")
    await user.type(screen.getByLabelText("Amount"), "10000")
    await user.click(screen.getByRole("button", { name: "Add" }))

    expect(await screen.findByText("Pay the seller more than they’re owed?")).toBeInTheDocument()
    await user.click(await screen.findByRole("button", { name: "Save anyway" }, { timeout: 3000 }))
    await waitFor(() => expect(createEntryAction).toHaveBeenCalledTimes(2))
    expect(createEntryAction.mock.calls[1]?.[0]).toMatchObject({ keepOverpayment: true })
  })
})

describe("deal card", () => {
  const card = (over: Partial<React.ComponentProps<typeof DealCard>> = {}) => (
    <DealCard
      vehicleId={CAR.id}
      deal={null}
      saleModel="purchase"
      paidToSeller={880000}
      owedToSeller={null}
      owedByBuyer={null}
      listedPrice={null}
      sellerPaymentStatus="no_terms"
      paidWithoutTerms
      {...over}
    />
  )

  it("flags money paid with no purchase rate and prefills the rate from it", async () => {
    const user = userEvent.setup()
    render(card())
    expect(screen.getByRole("alert")).toHaveTextContent("₹8,80,000 has been paid to the seller, but there’s no purchase rate")
    await user.click(screen.getByRole("button", { name: "Set purchase rate" }))
    expect(screen.getByLabelText("Purchase rate")).toHaveValue("8,80,000")
  })

  it("shows the paid status worked out from the entries", () => {
    render(
      card({
        deal: { purchaseRate: 880000, commissionPercent: null, purchasedOn: null, ownerExpectedPrice: null, minimumSellingPrice: null, note: null },
        owedToSeller: 0,
        sellerPaymentStatus: "full",
        paidWithoutTerms: false,
      })
    )
    expect(screen.getByTestId("seller-payment-status")).toHaveTextContent("Fully paid")
  })

  it("asks before saving a rate below what was paid, then keeps it", async () => {
    setDealAction
      .mockResolvedValueOnce({
        ok: false,
        error: { status: 422, code: "SELLER_PAID_ABOVE_RATE", message: "x", details: { paidToSeller: 880000, owedLimit: 800000, overpaidBy: 80000 } },
      })
      .mockResolvedValueOnce({ ok: true, data: undefined })
    const user = userEvent.setup()
    render(card())
    await user.click(screen.getByRole("button", { name: "Set purchase rate" }))
    const rate = screen.getByLabelText("Purchase rate")
    await user.clear(rate)
    await user.type(rate, "800000")
    await user.click(screen.getByRole("button", { name: "Save deal" }))

    expect(await screen.findByText("Seller paid more than the rate?")).toBeInTheDocument()
    await user.click(await screen.findByRole("button", { name: "Save anyway" }, { timeout: 3000 }))
    await waitFor(() => expect(setDealAction).toHaveBeenCalledTimes(2))
    expect(setDealAction.mock.calls[1]?.[1]).toMatchObject({ purchaseRate: 800000, keepOverpayment: true })
  })
})
