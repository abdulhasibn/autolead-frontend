import { describe, expect, it } from "vitest"
import { useState } from "react"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { ColourPicker } from "../components/colour-picker"

function Harness({ initial = "" }: { initial?: string }) {
  const [value, setValue] = useState(initial)
  return <ColourPicker id="colour" value={value} onValueChange={setValue} />
}

describe("ColourPicker", () => {
  it("picks a suggested colour as a chip", async () => {
    render(<Harness />)
    await userEvent.click(screen.getByRole("button", { name: "Silver" }))
    expect(screen.getByText("Silver")).toBeInTheDocument()
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument()
  })

  it("takes any typed colour on Enter, capitalised", async () => {
    render(<Harness />)
    await userEvent.type(screen.getByRole("textbox"), "  pearl   white{Enter}")
    expect(screen.getByText("Pearl White")).toBeInTheDocument()
  })

  it("clears the chip to choose again", async () => {
    render(<Harness initial="Polar White" />)
    await userEvent.click(screen.getByRole("button", { name: "Change colour from Polar White" }))
    expect(screen.getByRole("textbox")).toHaveValue("")
    expect(screen.getByRole("button", { name: "White" })).toBeInTheDocument()
  })
})
