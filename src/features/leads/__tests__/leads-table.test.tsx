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

  it("shows who a lead is assigned to, or Unassigned", () => {
    render(
      <LeadsTable
        leads={[
          { ...lead, id: "a", assignedTo: "u1", assignedToName: "Ravi Kumar" },
          { ...lead, id: "b", contactFullName: "Nina Rao", assignedTo: null, assignedToName: null },
        ]}
        vehicleLabels={{ [lead.vehicleId!]: "Car" }}
      />
    )
    expect(screen.getByRole("columnheader", { name: "Assigned to" })).toBeInTheDocument()
    expect(screen.getByText("Ravi Kumar")).toBeInTheDocument()
    expect(screen.getByText("Unassigned")).toBeInTheDocument()
  })

  it("links sortable headers and marks the active one", () => {
    render(
      <LeadsTable
        leads={[lead]}
        vehicleLabels={{ [lead.vehicleId!]: "Car" }}
        params={{ sort: "-budget", status: "new", page: 3 }}
      />
    )
    expect(screen.getByRole("columnheader", { name: "Budget" })).toHaveAttribute("aria-sort", "descending")
    expect(screen.getByRole("link", { name: "Budget" })).toHaveAttribute("href", "/leads?status=new&sort=budget")
    expect(screen.getByRole("columnheader", { name: "Created" })).toHaveAttribute("aria-sort", "none")
    // Back to the default order drops the param and returns to page 1.
    expect(screen.getByRole("link", { name: "Created" })).toHaveAttribute("href", "/leads?status=new")
  })
})
