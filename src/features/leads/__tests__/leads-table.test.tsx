import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import { LeadsTable } from "../components/leads-table"
import { baseLead } from "./fixtures"

const lead = baseLead

describe("LeadsTable", () => {
  it("renders a row per lead with readable labels", () => {
    render(
      <LeadsTable
        leads={[lead]}
        vehicleLabels={{ [lead.vehicleId!]: "2021 Hyundai Creta SX · KL07AB1234" }}
      />
    )

    const link = screen.getByRole("link", { name: "Asha Menon" })
    expect(link).toHaveAttribute("href", `/leads/${lead.id}`)
    expect(screen.getByText("Booking confirmed")).toBeInTheDocument()
    expect(screen.getByText("Walk-in")).toBeInTheDocument()
    expect(screen.getByText("2021 Hyundai Creta SX · KL07AB1234")).toBeInTheDocument()
    expect(screen.getByText("Test drive")).toBeInTheDocument()
    expect(screen.getByText(/6,50,000/)).toBeInTheDocument()
  })
})
