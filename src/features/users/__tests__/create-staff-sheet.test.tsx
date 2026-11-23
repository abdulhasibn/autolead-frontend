import { describe, expect, it, vi } from "vitest"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }))
vi.mock("../actions", () => ({ createUserAction: vi.fn() }))
vi.mock("sonner", () => ({ toast: { error: vi.fn(), success: vi.fn() } }))

import { CreateStaffSheet } from "../components/create-staff-sheet"

describe("CreateStaffSheet roles", () => {
  it("unticks the pre-ticked Salesperson and then asks for a role", async () => {
    const user = userEvent.setup()
    render(<CreateStaffSheet showrooms={[]} />)
    await user.click(screen.getByRole("button", { name: "Add staff" }))
    await screen.findByRole("dialog")
    const box = await screen.findByRole("checkbox", { name: /Salesperson/ })
    expect(box).toBeChecked()
    await user.click(box)
    await waitFor(() => expect(screen.getByRole("checkbox", { name: /Salesperson/ })).not.toBeChecked())
    await user.click(screen.getAllByRole("button", { name: "Add staff" }).at(-1)!)
    expect(await screen.findByText("Pick at least one role")).toBeInTheDocument()
    expect(screen.getByRole("checkbox", { name: /Salesperson/ })).not.toBeChecked()
  })
})
