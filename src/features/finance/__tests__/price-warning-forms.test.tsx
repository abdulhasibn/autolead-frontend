import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"

const setDealAction = vi.fn()
const recordSaleAction = vi.fn()

vi.mock("../actions", () => ({
  setDealAction: (...a: unknown[]) => setDealAction(...a),
  payOwnerAction: vi.fn(),
  recordSaleAction: (...a: unknown[]) => recordSaleAction(...a),
  removeSaleAction: vi.fn(),
}))
vi.mock("next/navigation", () => ({ useRouter: () => ({ replace: vi.fn(), refresh: vi.fn(), push: vi.fn() }) }))
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

import { DealCard } from "../components/vehicle-money/deal-card"
import { SaleCard } from "../components/vehicle-money/sale-card"

const deal = (minimumSellingPrice: number | null) => ({
  purchaseRate: null,
  commissionPercent: 3.5,
  purchasedOn: null,
  ownerExpectedPrice: null,
  minimumSellingPrice,
  note: null,
})

function dealCard(minimum: number | null, listed: number | null) {
  return (
    <DealCard vehicleId="v1" deal={deal(minimum)} saleModel="commission" paidToSeller={0} owedToSeller={null} owedByBuyer={null} listedPrice={listed} />
  )
}

describe("deal card: minimum selling price above the listed price", () => {
  beforeEach(() => vi.clearAllMocks())

  it("shows a warning on the saved deal", () => {
    render(dealCard(900000, 485000))
    expect(screen.getByText(/above the listed price/i)).toBeInTheDocument()
  })

  it("shows no warning when the minimum is under the listed price", () => {
    render(dealCard(400000, 485000))
    expect(screen.queryByText(/above the listed price/i)).toBeNull()
  })

  it("warns while typing in the form and still saves", async () => {
    setDealAction.mockResolvedValue({ ok: true, data: {} })
    const user = userEvent.setup()
    render(dealCard(null, 485000))
    await user.click(screen.getByRole("button", { name: /^edit$/i }))
    await user.type(screen.getByLabelText("Minimum selling price (optional)"), "900000")

    expect(screen.getByText(/above the listed price/i)).toBeInTheDocument()
    const save = screen.getByRole("button", { name: /save deal/i })
    expect(save).toBeEnabled()
    await user.click(save)

    expect(setDealAction).toHaveBeenCalledWith("v1", expect.objectContaining({ minimumSellingPrice: 900000 }))
  })
})

describe("sale card: price below the minimum selling price", () => {
  beforeEach(() => vi.clearAllMocks())

  it("warns on the form but still records the sale", async () => {
    recordSaleAction.mockResolvedValue({ ok: true, data: {} })
    const user = userEvent.setup()
    render(
      <SaleCard
        vehicleId="v1"
        sale={null}
        suggestedPrice={450000}
        receivedFromBuyer={0}
        minimumSellingPrice={500000}
        carSold
        bookedLeads={[]}
      />,
    )
    await user.click(screen.getByRole("button", { name: "Record sale" }))

    expect(screen.getByText(/under the minimum selling price/i)).toBeInTheDocument()
    await user.click(screen.getByRole("button", { name: /save sale/i }))

    expect(recordSaleAction).toHaveBeenCalledWith("v1", expect.objectContaining({ finalisedPrice: 450000 }))
  })

  it("is quiet when the price meets the minimum", async () => {
    const user = userEvent.setup()
    render(
      <SaleCard vehicleId="v1" sale={null} suggestedPrice={500000} receivedFromBuyer={0} minimumSellingPrice={500000} carSold bookedLeads={[]} />,
    )
    await user.click(screen.getByRole("button", { name: "Record sale" }))

    expect(screen.queryByText(/under the minimum selling price/i)).toBeNull()
  })
})
