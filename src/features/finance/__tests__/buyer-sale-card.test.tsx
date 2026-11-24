import { render, screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"
import type { BuyerRow } from "../types"

const recordSaleAction = vi.fn()
const removeSaleAction = vi.fn()

vi.mock("../actions", () => ({
  recordSaleAction: (...a: unknown[]) => recordSaleAction(...a),
  removeSaleAction: (...a: unknown[]) => removeSaleAction(...a),
}))
vi.mock("next/navigation", () => ({ useRouter: () => ({ replace: vi.fn(), refresh: vi.fn(), push: vi.fn() }) }))
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

import { SaleCard } from "../components/vehicle-money/sale-card"

const A = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa"
const B = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb"
const buyer = (id: string, name: string, net: number): BuyerRow => ({
  lead: { id, name, phone: null },
  paid: net,
  refunded: 0,
  net,
})
// A paid ₹50,000, B paid ₹1,00,000; the car-wide figure would be ₹1,50,000.
const BUYERS = [buyer(A, "Asha", 50000), buyer(B, "Bala", 100000)]
const LEADS = [
  { id: A, name: "Asha", phone: null },
  { id: B, name: "Bala", phone: null },
]

function renderCard(over: Partial<React.ComponentProps<typeof SaleCard>> = {}) {
  return render(
    <SaleCard
      vehicleId="v1"
      sale={null}
      suggestedPrice={500000}
      receivedFromBuyer={150000}
      minimumSellingPrice={null}
      carSold={false}
      bookedLeads={LEADS}
      buyers={BUYERS}
      {...over}
    />
  )
}

beforeEach(() => {
  vi.clearAllMocks()
  recordSaleAction.mockResolvedValue({ ok: true, data: undefined })
  removeSaleAction.mockResolvedValue({ ok: true, data: undefined })
})

describe("sale form: the chosen lead's figures", () => {
  it("shows what that lead paid, not the car-wide total", async () => {
    const user = userEvent.setup()
    renderCard()
    await user.click(screen.getByRole("button", { name: "Record sale" }))
    await user.click(screen.getByRole("radio", { name: /Asha/ }))
    expect(screen.getByText(/₹50,000 already received from this buyer/)).toBeInTheDocument()
    await user.click(screen.getByRole("radio", { name: /Bala/ }))
    expect(screen.getByText(/₹1,00,000 already received from this buyer/)).toBeInTheDocument()
    expect(screen.queryByText(/1,50,000/)).toBeNull()
  })

  it("Fully paid records the rest of the price for that lead only", async () => {
    const user = userEvent.setup()
    renderCard()
    await user.click(screen.getByRole("button", { name: "Record sale" }))
    await user.click(screen.getByRole("radio", { name: /Asha/ }))
    await user.click(screen.getByRole("button", { name: /Fully paid/i }))
    expect(screen.getByText(/₹4,50,000 will be recorded as received/)).toBeInTheDocument()
    await user.click(screen.getByRole("button", { name: /save sale/i }))
    await waitFor(() => expect(recordSaleAction).toHaveBeenCalledTimes(1))
    expect(recordSaleAction.mock.calls[0]?.[1]).toMatchObject({
      leadId: A,
      finalisedPrice: 500000,
      payment: { amount: 450000 },
    })
  })

  it("accepts a price that is above this lead's payments even though the car-wide total is higher", async () => {
    const user = userEvent.setup()
    renderCard({ suggestedPrice: 120000 })
    await user.click(screen.getByRole("button", { name: "Record sale" }))
    await user.click(screen.getByRole("radio", { name: /Asha/ }))
    await user.click(screen.getByRole("button", { name: /save sale/i }))
    expect(screen.queryByText("The buyer has paid more than this price")).toBeNull()
    await waitFor(() => expect(recordSaleAction).toHaveBeenCalledTimes(1))
  })

  it("the overpaid dialog uses the chosen lead's row, and 'reduce' asks the server to adjust", async () => {
    const user = userEvent.setup()
    renderCard({ suggestedPrice: 80000 })
    await user.click(screen.getByRole("button", { name: "Record sale" }))
    await user.click(screen.getByRole("radio", { name: /Bala/ }))
    await user.click(screen.getByRole("button", { name: /save sale/i }))
    const dialog = await screen.findByRole("alertdialog")
    expect(within(dialog).getByText(/₹1,00,000 is recorded as received from the buyer, but the new price is ₹80,000/)).toBeInTheDocument()
    expect(within(dialog).getByRole("button", { name: /Buyer overpaid: keep it \(refund ₹20,000\)/ })).toBeInTheDocument()
    await user.click(within(dialog).getByRole("button", { name: /Entered wrong: reduce it to ₹80,000/ }))
    await waitFor(() => expect(recordSaleAction).toHaveBeenCalledTimes(1))
    expect(recordSaleAction.mock.calls[0]?.[1]).toMatchObject({ leadId: B, finalisedPrice: 80000, buyerPayments: "adjust" })
  })

  it("on a sold car it uses the sold lead's row", async () => {
    const user = userEvent.setup()
    renderCard({ carSold: true, bookedLeads: [], buyers: [buyer(B, "Bala", 100000)], receivedFromBuyer: 100000 })
    await user.click(screen.getByRole("button", { name: "Record sale" }))
    expect(screen.getByText(/₹1,00,000 already received/)).toBeInTheDocument()
  })
})

describe("remove sale", () => {
  const sold = { finalisedPrice: 600000, soldOn: "2026-11-20", soldBy: "u1" }

  it("says payments from other buyers stay as refunds owed, and calls the server once", async () => {
    const user = userEvent.setup()
    renderCard({ sale: sold, carSold: true, bookedLeads: [], buyers: [buyer(B, "Bala", 100000)], receivedFromBuyer: 100000 })
    await user.click(screen.getByRole("button", { name: /Remove/ }))
    const dialog = await screen.findByRole("alertdialog")
    expect(within(dialog).getByText(/Payments from other buyers stay as refunds owed\./)).toBeInTheDocument()
    expect(within(dialog).getByText(/₹1,00,000 received from the buyer will also be deleted/)).toBeInTheDocument()
    await user.click(within(dialog).getByRole("button", { name: "Remove sale" }))
    await waitFor(() => expect(removeSaleAction).toHaveBeenCalledWith("v1"))
  })
})
