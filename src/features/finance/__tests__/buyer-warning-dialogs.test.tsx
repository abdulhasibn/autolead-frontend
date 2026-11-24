import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"

const getBuyerMoneyAction = vi.fn()
vi.mock("@/features/finance/actions", () => ({ getBuyerMoneyAction: (...a: unknown[]) => getBuyerMoneyAction(...a) }))
vi.mock("@/features/leads/actions", () => ({
  changeLeadStatusAction: vi.fn(),
  associateVehicleAction: vi.fn(),
}))
vi.mock("@/features/vehicles/actions", () => ({ changeVehicleStatusAction: vi.fn() }))
vi.mock("next/navigation", () => ({ useRouter: () => ({ replace: vi.fn(), refresh: vi.fn(), push: vi.fn() }) }))
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }))
vi.mock("@/hooks/use-form-draft", () => ({
  useDraftKey: () => null,
  useFormDraft: () => ({ clear: vi.fn(), restoredAt: null }),
}))
vi.mock("@/components/draft-banner", () => ({ DraftBanner: () => null }))
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

import { ChangeStatusDialog } from "@/features/leads/components/change-status-dialog"
import { LinkVehicleDialog } from "@/features/leads/components/link-vehicle-dialog"
import { ChangeVehicleStatusDialog } from "@/features/vehicles/components/change-vehicle-status-dialog"

const CAR = "11111111-1111-4111-8111-111111111111"
const LEAD = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa"
const WARNING = /₹50,000 was received from this buyer\. It will show in Dues as a refund owed\./

beforeEach(() => {
  vi.clearAllMocks()
  getBuyerMoneyAction.mockResolvedValue({ ok: true, data: { buyers: [{ leadId: LEAD, net: 50000 }], total: 50000 } })
})

describe("warning in Change status", () => {
  const open = async (status: "booking_confirmed" | "in_progress") => {
    const user = userEvent.setup()
    render(<ChangeStatusDialog lead={{ id: LEAD, status, vehicleId: CAR }} />)
    await user.click(screen.getByRole("button", { name: /change status/i }))
    return user
  }

  it("warns when a booked lead is moved to Lost, never before a status is picked", async () => {
    const user = await open("booking_confirmed")
    expect(getBuyerMoneyAction).not.toHaveBeenCalled()
    await user.selectOptions(screen.getByLabelText("status"), "lost")
    expect(await screen.findByTestId("buyer-leaving-warning")).toHaveTextContent(WARNING)
    expect(screen.getByRole("button", { name: "Save" })).toBeEnabled()
  })

  it("does not warn for Converted", async () => {
    const user = await open("booking_confirmed")
    await user.selectOptions(screen.getByLabelText("status"), "converted")
    expect(getBuyerMoneyAction).not.toHaveBeenCalled()
    expect(screen.queryByTestId("buyer-leaving-warning")).toBeNull()
  })

  it("does not warn for a lead that isn't booked", async () => {
    const user = await open("in_progress")
    await user.selectOptions(screen.getByLabelText("status"), "lost")
    expect(getBuyerMoneyAction).not.toHaveBeenCalled()
  })

  it("shows nothing when finance is locked", async () => {
    getBuyerMoneyAction.mockResolvedValue({ ok: true, data: null })
    const user = await open("booking_confirmed")
    await user.selectOptions(screen.getByLabelText("status"), "lost")
    await waitFor(() => expect(getBuyerMoneyAction).toHaveBeenCalled())
    expect(screen.queryByTestId("buyer-leaving-warning")).toBeNull()
  })
})

describe("warning in Change vehicle (moving a booking)", () => {
  const vehicles = [{ id: "22222222-2222-4222-8222-222222222222", label: "Baleno", linkable: true }]
  const render_ = (booked: boolean) =>
    render(<LinkVehicleDialog leadId={LEAD} currentVehicleId={CAR} vehicles={vehicles as never} booked={booked} />)

  it("warns once a new car is picked for a booked lead", async () => {
    const user = userEvent.setup()
    render_(true)
    await user.click(screen.getByRole("button", { name: /change vehicle/i }))
    expect(getBuyerMoneyAction).not.toHaveBeenCalled()
    await user.selectOptions(screen.getByLabelText("link-vehicle"), vehicles[0]!.id)
    expect(await screen.findByTestId("buyer-leaving-warning")).toHaveTextContent(WARNING)
  })

  it("does not warn when the lead isn't booked", async () => {
    const user = userEvent.setup()
    render_(false)
    await user.click(screen.getByRole("button", { name: /change vehicle/i }))
    await user.selectOptions(screen.getByLabelText("link-vehicle"), vehicles[0]!.id)
    expect(getBuyerMoneyAction).not.toHaveBeenCalled()
  })
})

describe("warning in Drop car", () => {
  it("warns when dropping a car that has linked leads", async () => {
    const user = userEvent.setup()
    render(<ChangeVehicleStatusDialog vehicleId={CAR} title="Swift" status="open" linkedLeadCount={1} />)
    await user.click(screen.getByRole("button", { name: "Drop" }))
    expect(await screen.findByTestId("buyer-leaving-warning")).toHaveTextContent("₹50,000 was received from this buyer")
  })

  it("does not look anything up for a car with no linked leads", async () => {
    const user = userEvent.setup()
    render(<ChangeVehicleStatusDialog vehicleId={CAR} title="Swift" status="open" linkedLeadCount={0} />)
    await user.click(screen.getByRole("button", { name: "Drop" }))
    expect(getBuyerMoneyAction).not.toHaveBeenCalled()
  })

  it("does not warn when re-listing", async () => {
    const user = userEvent.setup()
    render(<ChangeVehicleStatusDialog vehicleId={CAR} title="Swift" status="dropped" linkedLeadCount={1} />)
    await user.click(screen.getByRole("button", { name: "Re-list" }))
    expect(getBuyerMoneyAction).not.toHaveBeenCalled()
  })
})
