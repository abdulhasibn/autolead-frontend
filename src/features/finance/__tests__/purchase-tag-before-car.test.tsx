import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"

vi.mock("../actions", () => ({
  setDealAction: vi.fn(),
  createEntryAction: vi.fn(),
  updateEntryAction: vi.fn(),
  payOwnerAction: vi.fn(),
}))
vi.mock("../use-vehicle-money", () => ({ useVehicleMoney: () => null }))
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
    <button type="button" onClick={() => p.onChange({ id: "11111111-1111-4111-8111-111111111111", label: "Maruti Swift" })}>
      pick car
    </button>
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

const renderSheet = (kind: "expense" | "income" = "expense") =>
  render(<EntrySheet open onOpenChange={() => {}} tags={TAGS} showrooms={[]} defaultKind={kind} />)

beforeEach(() => vi.clearAllMocks())

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

  it("keeps a hand-picked purpose when the car changes", async () => {
    const user = userEvent.setup()
    renderSheet()
    await user.click(screen.getByRole("button", { name: "tag Purchase" }))
    await user.click(screen.getByRole("button", { name: "pick car" }))
    await user.selectOptions(screen.getByLabelText("entry-purpose"), "cost")
    await user.click(screen.getByRole("button", { name: "pick car" }))
    expect(screen.getByLabelText("entry-purpose")).toHaveValue("cost")
  })

  it("income is unaffected", async () => {
    const user = userEvent.setup()
    renderSheet("income")
    await user.click(screen.getByRole("button", { name: "tag Purchase" }))
    await user.click(screen.getByRole("button", { name: "pick car" }))
    expect(screen.getByLabelText("entry-purpose")).not.toHaveValue("purchase")
  })
})
