import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"
import type { BuyerRow, FinanceEntry, RefundOwedRow } from "../types"

const createEntryAction = vi.fn()
const updateEntryAction = vi.fn()
const getCarBuyersAction = vi.fn()

vi.mock("../actions", () => ({
  setDealAction: vi.fn(),
  payOwnerAction: vi.fn(),
  createEntryAction: (...a: unknown[]) => createEntryAction(...a),
  updateEntryAction: (...a: unknown[]) => updateEntryAction(...a),
  getCarBuyersAction: (...a: unknown[]) => getCarBuyersAction(...a),
}))
vi.mock("../use-vehicle-money", () => ({ useVehicleMoney: () => null }))
vi.mock("@/components/option-select", () => ({
  OptionSelect: (p: { id?: string; value: string; onValueChange: (v: string) => void; options: { value: string; label: string }[]; disabled?: boolean }) => (
    <select id={p.id} aria-label={p.id} value={p.value} disabled={p.disabled} onChange={(e) => p.onValueChange(e.target.value)}>
      <option value="">none</option>
      {p.options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  ),
}))
vi.mock("../components/pickers", () => ({
  VehiclePicker: (p: { onChange: (o: { id: string; label: string } | null) => void }) => (
    <button type="button" onClick={() => p.onChange({ id: CAR_ID, label: "Maruti Swift" })}>
      pick car
    </button>
  ),
}))
vi.mock("../components/tag-multi-select", () => ({ TagMultiSelect: () => null }))
vi.mock("next/navigation", () => ({ useRouter: () => ({ replace: vi.fn(), refresh: vi.fn(), push: vi.fn() }) }))
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

import { EntrySheet } from "../components/entry-sheet"

const CAR_ID = "11111111-1111-4111-8111-111111111111"
const A_ID = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa"
const B_ID = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb"
const CAR = { id: CAR_ID, label: "Maruti Swift" }

const buyer = (id: string, name: string, paid: number): BuyerRow => ({
  lead: { id, name, phone: "9000000000" },
  paid,
  refunded: 0,
  net: paid,
})
const BUYER_A = buyer(A_ID, "Asha", 50000)
const BUYER_B = buyer(B_ID, "Bala", 100000)

const saleEntry = (lead: { id: string; name: string } | null, purpose: FinanceEntry["purpose"] = "sale"): FinanceEntry =>
  ({
    id: "e1",
    kind: "income",
    amount: 50000,
    entryDate: "2026-11-20",
    purpose,
    tags: [],
    vehicle: CAR,
    lead,
    party: null,
    note: null,
    showroomId: "s1",
    recordedBy: "u1",
    createdAt: "",
    updatedAt: "",
  }) as FinanceEntry

function renderSheet(props: Partial<React.ComponentProps<typeof EntrySheet>> = {}) {
  return render(
    <EntrySheet open onOpenChange={() => {}} tags={[]} showrooms={[]} defaultKind="income" defaultVehicle={CAR} lockVehicle {...props} />
  )
}

beforeEach(() => {
  vi.clearAllMocks()
  createEntryAction.mockResolvedValue({ ok: true, data: {} })
  updateEntryAction.mockResolvedValue({ ok: true, data: {} })
  getCarBuyersAction.mockResolvedValue({ ok: true, data: { buyers: [], refundsOwed: [] } })
})

describe("Payment from buyer: Paid by", () => {
  it("preselects the only current buyer and sends their lead", async () => {
    const user = userEvent.setup()
    renderSheet({ carBuyers: { buyers: [BUYER_A], refundsOwed: [] } })
    await waitFor(() => expect(screen.getByLabelText("entry-lead")).toHaveValue(A_ID))
    await user.type(screen.getByLabelText("Amount"), "10000")
    await user.click(screen.getByRole("button", { name: "Add" }))
    await waitFor(() => expect(createEntryAction).toHaveBeenCalledTimes(1))
    expect(createEntryAction.mock.calls[0]?.[0]).toMatchObject({ purpose: "sale", leadId: A_ID, vehicleId: CAR_ID })
  })

  it("is required with several buyers: nothing is sent until one is picked", async () => {
    const user = userEvent.setup()
    renderSheet({ carBuyers: { buyers: [BUYER_A, BUYER_B], refundsOwed: [] } })
    expect(screen.getByLabelText("entry-lead")).toHaveValue("")
    await user.type(screen.getByLabelText("Amount"), "10000")
    await user.click(screen.getByRole("button", { name: "Add" }))
    expect(await screen.findByText("Pick who paid")).toBeInTheDocument()
    expect(createEntryAction).not.toHaveBeenCalled()

    await user.selectOptions(screen.getByLabelText("entry-lead"), B_ID)
    await user.click(screen.getByRole("button", { name: "Add" }))
    await waitFor(() => expect(createEntryAction).toHaveBeenCalledTimes(1))
    expect(createEntryAction.mock.calls[0]?.[0]).toMatchObject({ leadId: B_ID })
  })

  it("looks the buyers up when the car comes from the picker (Ledger)", async () => {
    getCarBuyersAction.mockResolvedValue({ ok: true, data: { buyers: [BUYER_B], refundsOwed: [] } })
    const user = userEvent.setup()
    renderSheet({ defaultVehicle: null, lockVehicle: false })
    await user.click(screen.getByRole("button", { name: "pick car" }))
    await waitFor(() => expect(screen.getByLabelText("entry-lead")).toHaveValue(B_ID))
    expect(getCarBuyersAction).toHaveBeenCalledWith(CAR_ID)
  })

  it("shows a lead who is no longer a buyer read-only and keeps it on save", async () => {
    const user = userEvent.setup()
    renderSheet({
      entry: saleEntry({ id: A_ID, name: "Asha" }),
      carBuyers: { buyers: [BUYER_B], refundsOwed: [{ lead: BUYER_A.lead, paid: 50000, refunded: 0, owed: 50000 }] },
    })
    expect(await screen.findByTestId("entry-paid-by-readonly")).toHaveTextContent("Asha")
    expect(screen.queryByLabelText("entry-lead")).toBeNull()
    await user.clear(screen.getByLabelText("Amount"))
    await user.type(screen.getByLabelText("Amount"), "45000")
    await user.click(screen.getByRole("button", { name: "Save" }))
    await waitFor(() => expect(updateEntryAction).toHaveBeenCalledTimes(1))
    expect(updateEntryAction.mock.calls[0]?.[1]).toMatchObject({ amount: 45000, leadId: A_ID })
  })
})

describe("Refund to buyer", () => {
  const owed: RefundOwedRow = { lead: BUYER_A.lead, paid: 50000, refunded: 0, owed: 50000 }

  it("opens prefilled from Record refund: purpose, lead, amount owed", async () => {
    const user = userEvent.setup()
    renderSheet({
      defaultKind: "expense",
      carBuyers: { buyers: [], refundsOwed: [owed] },
      prefill: { purpose: "refund", leadId: A_ID, amount: 50000 },
    })
    expect(screen.getByLabelText("entry-purpose")).toHaveValue("refund")
    expect(screen.getByLabelText("entry-lead")).toHaveValue(A_ID)
    expect(screen.getByLabelText("Amount")).toHaveValue("50,000")
    expect(screen.getByText(/at most ₹50,000 can be refunded/i)).toBeInTheDocument()
    await user.click(screen.getByRole("button", { name: "Add" }))
    await waitFor(() => expect(createEntryAction).toHaveBeenCalledTimes(1))
    expect(createEntryAction.mock.calls[0]?.[0]).toMatchObject({ kind: "expense", purpose: "refund", leadId: A_ID, amount: 50000 })
  })

  it("requires the buyer to be picked", async () => {
    const user = userEvent.setup()
    renderSheet({
      defaultKind: "expense",
      carBuyers: { buyers: [BUYER_A, BUYER_B], refundsOwed: [] },
    })
    await user.selectOptions(screen.getByLabelText("entry-purpose"), "refund")
    await user.type(screen.getByLabelText("Amount"), "1000")
    await user.click(screen.getByRole("button", { name: "Add" }))
    expect(await screen.findByText("Pick the buyer this refund goes to")).toBeInTheDocument()
    expect(createEntryAction).not.toHaveBeenCalled()
  })

  it("offers Refund to buyer as an expense purpose with its hint", () => {
    renderSheet({ defaultKind: "expense", carBuyers: { buyers: [], refundsOwed: [] } })
    expect(screen.getByRole("option", { name: "Refund to buyer" })).toBeInTheDocument()
  })
})

describe("forfeit: buyer money turned into Other income", () => {
  it("asks first, and saves only after Keep it", async () => {
    const user = userEvent.setup()
    renderSheet({ entry: saleEntry({ id: A_ID, name: "Asha" }), carBuyers: { buyers: [BUYER_A], refundsOwed: [] } })
    await user.selectOptions(screen.getByLabelText("entry-purpose"), "other")
    await user.click(screen.getByRole("button", { name: "Save" }))
    expect(await screen.findByText("Keep this money?")).toBeInTheDocument()
    expect(screen.getByText(/no longer be owed back/i)).toBeInTheDocument()
    expect(updateEntryAction).not.toHaveBeenCalled()

    await user.click(screen.getByRole("button", { name: "Keep it" }))
    await waitFor(() => expect(updateEntryAction).toHaveBeenCalledTimes(1))
    const body = updateEntryAction.mock.calls[0]?.[1]
    expect(body).toMatchObject({ purpose: "other" })
    expect(body).not.toHaveProperty("leadId")
  })

  it("does not ask for an ordinary edit", async () => {
    const user = userEvent.setup()
    renderSheet({ entry: saleEntry({ id: A_ID, name: "Asha" }), carBuyers: { buyers: [BUYER_A], refundsOwed: [] } })
    await user.click(screen.getByRole("button", { name: "Save" }))
    await waitFor(() => expect(updateEntryAction).toHaveBeenCalledTimes(1))
    expect(screen.queryByText("Keep this money?")).toBeNull()
  })
})
