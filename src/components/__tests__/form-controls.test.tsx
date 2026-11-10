import { useState } from "react"
import { render, screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { OptionSelect, SEARCH_THRESHOLD } from "@/components/option-select"
import { matchesQuery } from "@/components/ui/combobox"
import { DatePicker } from "@/components/ui/date-picker"
import { variantLabel } from "@/features/vehicles/utils"

/** jsdom has no matchMedia; `mobile` decides what `(max-width: 767px)` reports. */
function stubMatchMedia(mobile: boolean) {
  vi.stubGlobal(
    "matchMedia",
    vi.fn((query: string) => ({
      matches: mobile && query.includes("max-width"),
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }))
  )
}

const MAKES = ["Audi", "Bentley", "BMW", "BYD", "Chevrolet", "Citroen", "Datsun", "Ferrari", "Fiat", "Ford"].map(
  (name) => ({ value: name.toLowerCase(), label: name })
)

function Harness({ options = MAKES }: { options?: typeof MAKES }) {
  const [value, setValue] = useState("")
  return (
    <>
      <OptionSelect value={value} onValueChange={setValue} options={options} placeholder="Select make" aria-label="Make" />
      <output data-testid="value">{value}</output>
    </>
  )
}

describe("OptionSelect", () => {
  beforeEach(() => stubMatchMedia(true))

  it("stays a plain select for short lists", () => {
    render(<Harness options={MAKES.slice(0, SEARCH_THRESHOLD)} />)
    expect(screen.getByRole("combobox", { name: "Make" })).not.toHaveAttribute("aria-haspopup", "dialog")
  })

  it("adds a search box to long lists and filters by it", async () => {
    const user = userEvent.setup()
    render(<Harness />)

    await user.click(screen.getByRole("button", { name: "Make" }))
    await user.type(screen.getByRole("searchbox", { name: "Search" }), "b")

    const list = screen.getByRole("listbox")
    expect(within(list).getAllByRole("option").map((o) => o.textContent)).toEqual(["Bentley", "BMW", "BYD"])

    await user.click(within(list).getByRole("option", { name: "Bentley" }))
    expect(screen.getByTestId("value")).toHaveTextContent("bentley")
    expect(screen.getByRole("button", { name: "Make" })).toHaveTextContent("Bentley")
  })

  it("says so when nothing matches", async () => {
    const user = userEvent.setup()
    render(<Harness />)
    await user.click(screen.getByRole("button", { name: "Make" }))
    await user.type(screen.getByRole("searchbox", { name: "Search" }), "zzz")
    expect(screen.getByText("No matches")).toBeInTheDocument()
  })
})

describe("matchesQuery", () => {
  it("ignores case, accents and surrounding spaces", () => {
    expect(matchesQuery("Citroën", " citroen ")).toBe(true)
    expect(matchesQuery("Aston Martin", "MART")).toBe(true)
    expect(matchesQuery("Audi", "bmw")).toBe(false)
  })
})

describe("DatePicker", () => {
  beforeEach(() => stubMatchMedia(false))

  it("offers month and year dropdowns limited to the given years", async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<DatePicker value="2027-06-15" onChange={onChange} fromYear={2025} toYear={2030} />)

    await user.click(screen.getByRole("button", { name: /15 Jun 2027/ }))

    const year = await screen.findByRole("combobox", { name: /year/i })
    const years = within(year).getAllByRole("option").map((o) => o.textContent)
    expect(years).toEqual(["2025", "2026", "2027", "2028", "2029", "2030"])
    expect(screen.getByRole("combobox", { name: /month/i })).toBeInTheDocument()

    await user.selectOptions(year, "2029")
    await user.click(screen.getByRole("button", { name: /June 20th, 2029/ }))
    await waitFor(() => expect(onChange).toHaveBeenCalledWith("2029-06-20"))
  })
})

describe("variantLabel", () => {
  it("hides the NA placeholder variant", () => {
    expect(variantLabel("NA")).toBeNull()
    expect(variantLabel("na ")).toBeNull()
    expect(variantLabel(null)).toBeNull()
    expect(variantLabel("SX(O)")).toBe("SX(O)")
  })
})
