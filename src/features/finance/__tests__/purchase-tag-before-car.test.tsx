import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"
import type { VehicleMoneySummary } from "../types"

const createEntryAction = vi.fn()
let summary: VehicleMoneySummary | null = null

vi.mock("../actions", () => ({
  setDealAction: vi.fn(),
  createEntryAction: (...a: unknown[]) => createEntryAction(...a),
  updateEntryAction: vi.fn(),
  payOwnerAction: vi.fn(),
  getCarBuyersAction: vi.fn().mockResolvedValue({ ok: true, data: { buyers: [], refundsOwed: [] } }),
}))
vi.mock("../use-vehicle-money", () => ({
  useVehicleMoney: (ids: string[], enabled: boolean) =>
    enabled && summary && ids[0] ? new Map([[ids[0], summary]]) : null,
}))
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
vi.mock("../components/pickers", () => ({
  VehiclePicker: (p: { onChange: (o: { id: string; label: string } | null) => void }) => (
    <>
      <button type="button" onClick={() => p.onChange({ id: "11111111-1111-4111-8111-111111111111", label: "Maruti Swift" })}>
        pick car
      </button>
      <button type="button" onClick={() => p.onChange(null)}>
        clear car
      </button>
    </>
  ),
}))
vi.mock("../components/tag-multi-select", () => ({
  TagMultiSelect: (p: { tags: { id: string; name: string }[]; onValueChange: (v: string[]) => void }) => (
    <>
      {p.tags.map((t) => (
        <button key={t.id} type="button" onClick={() => p.onValueChange([t.id])}>
          {`tag ${t.name}`}
        </button>
      ))}
    </>
  ),
}))
vi.mock("next/navigation", () => ({ useRouter: () => ({ replace: vi.fn(), refresh: vi.fn(), push: vi.fn() }) }))
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

import { EntrySheet } from "../components/entry-sheet"

const TAGS = [
  { id: "t-purchase", name: "Purchase", color: null, isActive: true },
  { id: "t-fuel", name: "Fuel", color: null, isActive: true },
] as unknown as React.ComponentProps<typeof EntrySheet>["tags"]

const CAR_ID = "11111111-1111-4111-8111-111111111111"

const renderSheet = (kind: "expense" | "income" = "expense", entry?: React.ComponentProps<typeof EntrySheet>["entry"]) =>
  render(<EntrySheet open onOpenChange={() => {}} tags={TAGS} showrooms={[]} defaultKind={kind} entry={entry} />)

const summaryFor = (over: Partial<VehicleMoneySummary> = {}): VehicleMoneySummary => ({
  vehicleId: CAR_ID,
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

const savedEntry = (purpose: "cost" | "general", withCar: boolean) =>
  ({
    id: "e1",
    kind: "expense",
    amount: 5000,
    entryDate: "2026-11-20",
    purpose,
    tags: [TAGS[0]],
    vehicle: withCar ? { id: CAR_ID, label: "Maruti Swift" } : null,
    party: null,
    note: null,
    showroomId: "s1",
    recordedBy: "u1",
    createdAt: "",
    updatedAt: "",
  }) as unknown as React.ComponentProps<typeof EntrySheet>["entry"]

beforeEach(() => {
  vi.clearAllMocks()
  summary = null
})

describe("expense form: Purchase tag and car in either order", () => {
  it("tag first, then car: purpose becomes payment to the seller", async () => {
    const user = userEvent.setup()
    renderSheet()
    await user.click(screen.getByRole("button", { name: "tag Purchase" }))
    await user.click(screen.getByRole("button", { name: "pick car" }))
    expect(screen.getByLabelText("entry-purpose")).toHaveValue("purchase")
  })

  it("car first, then tag: same result", async () => {
    const user = userEvent.setup()
    renderSheet()
    await user.click(screen.getByRole("button", { name: "pick car" }))
    await user.click(screen.getByRole("button", { name: "tag Purchase" }))
    expect(screen.getByLabelText("entry-purpose")).toHaveValue("purchase")
  })

  it("another tag first, then car: stays a car cost", async () => {
    const user = userEvent.setup()
    renderSheet()
    await user.click(screen.getByRole("button", { name: "tag Fuel" }))
    await user.click(screen.getByRole("button", { name: "pick car" }))
    expect(screen.getByLabelText("entry-purpose")).toHaveValue("cost")
  })

  it("tag first, then car: asks for the deal and saves a payment with it", async () => {
    summary = summaryFor()
    createEntryAction.mockResolvedValue({ ok: true, data: {} })
    const user = userEvent.setup()
    renderSheet()
    await user.click(screen.getByRole("button", { name: "tag Purchase" }))
    await user.click(screen.getByRole("button", { name: "pick car" }))
    expect(screen.getByRole("group", { name: "Deal with the seller" })).toBeInTheDocument()

    await user.type(screen.getByLabelText("Amount"), "880000")
    await user.type(screen.getByLabelText("Purchase rate"), "880000")
    await user.click(screen.getByRole("button", { name: "Add" }))
    await waitFor(() => expect(createEntryAction).toHaveBeenCalledTimes(1))
    expect(createEntryAction.mock.calls[0]?.[0]).toMatchObject({
      purpose: "purchase",
      vehicleId: CAR_ID,
      deal: { purchaseRate: 880000 },
    })
  })

  it("keeps a hand-picked Car cost after the car is cleared and picked again", async () => {
    const user = userEvent.setup()
    renderSheet()
    await user.click(screen.getByRole("button", { name: "tag Purchase" }))
    await user.click(screen.getByRole("button", { name: "pick car" }))
    await user.selectOptions(screen.getByLabelText("entry-purpose"), "cost")
    await user.click(screen.getByRole("button", { name: "clear car" }))
    await user.click(screen.getByRole("button", { name: "pick car" }))
    expect(screen.getByLabelText("entry-purpose")).toHaveValue("cost")
  })

  it("edit: a saved car cost tagged Purchase stays a car cost after clear and re-pick", async () => {
    const user = userEvent.setup()
    renderSheet("expense", savedEntry("cost", true))
    await user.click(screen.getByRole("button", { name: "clear car" }))
    await user.click(screen.getByRole("button", { name: "pick car" }))
    expect(screen.getByLabelText("entry-purpose")).toHaveValue("cost")
  })

  it("edit: a general entry tagged Purchase is not turned into a seller payment by linking a car", async () => {
    const user = userEvent.setup()
    renderSheet("expense", savedEntry("general", false))
    await user.click(screen.getByRole("button", { name: "pick car" }))
    expect(screen.getByLabelText("entry-purpose")).not.toHaveValue("purchase")
  })

  it("income is unaffected", async () => {
    const user = userEvent.setup()
    renderSheet("income")
    await user.click(screen.getByRole("button", { name: "tag Purchase" }))
    await user.click(screen.getByRole("button", { name: "pick car" }))
    expect(screen.getByLabelText("entry-purpose")).toHaveValue("sale")
  })

  it("commission car: tag first, then car still asks for the deal with a commission", async () => {
    summary = summaryFor({ saleModel: "commission" })
    const user = userEvent.setup()
    renderSheet()
    await user.click(screen.getByRole("button", { name: "tag Purchase" }))
    await user.click(screen.getByRole("button", { name: "pick car" }))
    expect(screen.getByLabelText("entry-purpose")).toHaveValue("purchase")
    expect(screen.getByRole("group", { name: "Deal with the seller" })).toBeInTheDocument()
  })
})
