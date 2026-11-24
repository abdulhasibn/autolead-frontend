import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"
import type { CarMoney } from "../types"

const assignBuyerMoneyAction = vi.fn()
const toastError = vi.fn()

vi.mock("../actions", () => ({
  assignBuyerMoneyAction: (...a: unknown[]) => assignBuyerMoneyAction(...a),
  createEntryAction: vi.fn(),
  updateEntryAction: vi.fn(),
  getCarBuyersAction: vi.fn().mockResolvedValue({ ok: true, data: { buyers: [], refundsOwed: [] } }),
}))
vi.mock("../use-vehicle-money", () => ({ useVehicleMoney: () => null }))
vi.mock("@/components/option-select", () => ({
  OptionSelect: (p: { id?: string; value: string; onValueChange: (v: string) => void; options: { value: string; label: string }[] }) => (
    <select id={p.id} aria-label={p.id} value={p.value} onChange={(e) => p.onValueChange(e.target.value)}>
      <option value="">none</option>
      {p.options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  ),
}))
vi.mock("../components/tag-multi-select", () => ({ TagMultiSelect: () => null }))
vi.mock("../components/pickers", () => ({
  VehiclePicker: () => null,
  LeadPicker: (p: { onChange: (o: { id: string; label: string }) => void }) => (
    <button type="button" onClick={() => p.onChange({ id: "ccccccc1-cccc-4ccc-8ccc-cccccccccccc", label: "Chitra" })}>
      pick lead
    </button>
  ),
}))
vi.mock("next/navigation", () => ({ useRouter: () => ({ replace: vi.fn(), refresh: vi.fn(), push: vi.fn() }) }))
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: (...a: unknown[]) => toastError(...a) } }))

import { RefundsOwedCard } from "../components/vehicle-money/refunds-owed-card"

const A = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa"
const lead = (id: string, name: string) => ({ id, name, phone: null })

function money(refundsOwed: CarMoney["refundsOwed"]): Pick<CarMoney, "vehicleId" | "vehicle" | "buyers" | "refundsOwed"> {
  return {
    vehicleId: "11111111-1111-4111-8111-111111111111",
    vehicle: { id: "11111111-1111-4111-8111-111111111111", label: "Maruti Swift", saleModel: "purchase", status: "open" },
    buyers: [],
    refundsOwed,
  }
}

const renderCard = (m: ReturnType<typeof money>) => render(<RefundsOwedCard money={m} tags={[]} showrooms={[]} />)

beforeEach(() => {
  vi.clearAllMocks()
  assignBuyerMoneyAction.mockResolvedValue({ ok: true, data: { assigned: 1, failed: 0, total: 1 } })
})

describe("Refunds owed", () => {
  it("renders nothing when nobody is owed anything", () => {
    const { container } = renderCard(money([]))
    expect(container).toBeEmptyDOMElement()
  })

  it("lists who is owed and opens Add expense prefilled to refund the amount owed, dated today", async () => {
    const user = userEvent.setup()
    renderCard(money([{ lead: lead(A, "Asha"), paid: 50000, refunded: 0, owed: 50000 }]))
    expect(screen.getByTestId("refunds-owed")).toHaveTextContent("Asha")
    await user.click(screen.getByRole("button", { name: "Record refund" }))
    expect(await screen.findByText("Add expense")).toBeInTheDocument()
    expect(screen.getByLabelText("entry-purpose")).toHaveValue("refund")
    expect(screen.getByLabelText("entry-lead")).toHaveValue(A)
    expect(screen.getByLabelText("Amount")).toHaveValue("50,000")
  })

  it("hides Record refund when nothing is owed (negative: refunded more than paid)", () => {
    renderCard(money([{ lead: lead(A, "Asha"), paid: 10000, refunded: 20000, owed: -10000 }]))
    expect(screen.getByTestId("refunds-owed")).toHaveTextContent("Asha")
    expect(screen.queryByRole("button", { name: "Record refund" })).toBeNull()
  })
})

describe("Unassigned buyer money", () => {
  it("assigns it to the picked lead", async () => {
    const user = userEvent.setup()
    renderCard(money([{ lead: null, paid: 30000, refunded: 0, owed: 30000 }]))
    expect(screen.getByTestId("unassigned-buyer-money")).toBeInTheDocument()
    expect(screen.queryByTestId("refunds-owed")).toBeNull()
    await user.click(screen.getByRole("button", { name: "Assign to lead" }))
    const assign = await screen.findByRole("button", { name: "Assign" })
    expect(assign).toBeDisabled()
    await user.click(screen.getByRole("button", { name: "pick lead" }))
    await user.click(assign)
    await waitFor(() =>
      expect(assignBuyerMoneyAction).toHaveBeenCalledWith(
        "11111111-1111-4111-8111-111111111111",
        "ccccccc1-cccc-4ccc-8ccc-cccccccccccc"
      )
    )
  })

  it("tells the admin when only some payments were assigned", async () => {
    assignBuyerMoneyAction.mockResolvedValue({ ok: true, data: { assigned: 2, failed: 1, total: 3 } })
    const user = userEvent.setup()
    renderCard(money([{ lead: null, paid: 30000, refunded: 0, owed: 30000 }]))
    await user.click(screen.getByRole("button", { name: "Assign to lead" }))
    await user.click(await screen.findByRole("button", { name: "pick lead" }))
    await user.click(screen.getByRole("button", { name: "Assign" }))
    await waitFor(() => expect(toastError).toHaveBeenCalledWith("Assigned 2 of 3. Press Assign again to finish."))
  })

  it("labels the lead picker", async () => {
    const user = userEvent.setup()
    renderCard(money([{ lead: null, paid: 30000, refunded: 0, owed: 30000 }]))
    await user.click(screen.getByRole("button", { name: "Assign to lead" }))
    expect(await screen.findByText("Lead")).toBeInTheDocument()
  })
})
