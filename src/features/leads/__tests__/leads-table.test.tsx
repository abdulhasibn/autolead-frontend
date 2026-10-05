import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import { LeadsTable } from "../components/leads-table"
import type { LeadReadModel } from "../types"

const lead: LeadReadModel = {
  id: "11111111-1111-4111-8111-111111111111",
  showroomId: "22222222-2222-4222-8222-222222222222",
  vehicleId: "33333333-3333-4333-8333-333333333333",
  assignedTo: null,
  contactId: "44444444-4444-4444-8444-444444444444",
  contactFullName: "Asha Menon",
  contactPhone: "+919876543210",
  contactEmail: null,
  source: "walkin",
  status: "booking_confirmed",
  budget: 650000,
  preferredVehicle: null,
  purchaseTimeline: null,
  financeRequired: null,
  currentVehicle: null,
  tradeInRequired: null,
  notes: null,
  nextFollowUp: {
    id: "55555555-5555-4555-8555-555555555555",
    taskType: "test_drive",
    scheduledAt: "2026-10-06T05:30:00.000Z",
    notes: null,
  },
  createdBy: "66666666-6666-4666-8666-666666666666",
  createdAt: "2026-10-01T05:30:00.000Z",
  updatedAt: "2026-10-01T05:30:00.000Z",
}

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
