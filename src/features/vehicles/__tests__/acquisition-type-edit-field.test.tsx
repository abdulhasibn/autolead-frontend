import { describe, expect, it, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import { AcquisitionTypeEditField } from "../components/acquisition-type-edit-field"
import { ACQUISITION_TYPE_LABELS } from "../constants"

describe("AcquisitionTypeEditField", () => {
  it("shows the saved type read-only to non-admins", () => {
    render(
      <AcquisitionTypeEditField value="consignment" onValueChange={vi.fn()} savedType="consignment" canChange={false} />
    )
    const input = screen.getByLabelText("How was it acquired?")
    expect(input).toHaveAttribute("readonly")
    expect(input).toHaveValue(ACQUISITION_TYPE_LABELS.consignment)
    expect(screen.getByText("Only an admin can change this.")).toBeInTheDocument()
    expect(screen.queryByRole("combobox")).not.toBeInTheDocument()
  })

  it("gives admins the select, and warns once the type changes", () => {
    const { rerender } = render(
      <AcquisitionTypeEditField value="consignment" onValueChange={vi.fn()} savedType="consignment" canChange />
    )
    expect(screen.queryByText("Only an admin can change this.")).not.toBeInTheDocument()
    expect(screen.queryByText(/entering the purchase rate or commission again/)).not.toBeInTheDocument()

    rerender(<AcquisitionTypeEditField value="dealership_purchase" onValueChange={vi.fn()} savedType="consignment" canChange />)
    expect(screen.getByText(/entering the purchase rate or commission again/)).toBeInTheDocument()
  })
})
