import { beforeEach, describe, expect, it, vi } from "vitest"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"

vi.mock("next-auth/react", () => ({ useSession: () => ({ data: { user: { id: "user-1" } } }) }))
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }))
vi.mock("../actions", () => ({ createOwnerAction: vi.fn() }))
vi.mock("sonner", () => ({ toast: { error: vi.fn(), success: vi.fn() } }))

import { __resetDraftStoreForTests } from "@/lib/drafts/store"
import { toast } from "sonner"
import { createOwnerAction } from "../actions"
import { CreateOwnerSheet } from "../components/create-owner-sheet"

beforeEach(() => {
  localStorage.clear()
  __resetDraftStoreForTests()
})

async function openSheet(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole("button", { name: "Add owner" }))
  return screen.findByRole("dialog")
}

describe("CreateOwnerSheet", () => {
  it("starts fresh after Cancel: no typed name and no old error", async () => {
    const user = userEvent.setup()
    render(<CreateOwnerSheet />)
    const sheet = await openSheet(user)
    await waitFor(() => expect(sheet).toBeVisible())

    await user.type(screen.getByLabelText("Full name"), "Half typed")
    await user.click(screen.getByRole("button", { name: "Create owner" }))
    expect(await screen.findByText("Enter a 10-digit mobile number")).toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "Cancel" }))
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument())

    await openSheet(user)
    expect(screen.getByLabelText("Full name")).toHaveValue("")
    expect(screen.queryByText("Enter a 10-digit mobile number")).not.toBeInTheDocument()
    expect(screen.queryByText(/Draft from/)).not.toBeInTheDocument()
  })

  it("keeps the typed name as a draft when closed with Escape, without the old error", async () => {
    const user = userEvent.setup()
    render(<CreateOwnerSheet />)
    await openSheet(user)
    await user.type(screen.getByLabelText("Full name"), "Kept")
    await user.click(screen.getByRole("button", { name: "Create owner" }))
    expect(await screen.findByText("Enter a 10-digit mobile number")).toBeInTheDocument()
    await new Promise((r) => setTimeout(r, 500)) // draft autosave

    await user.keyboard("{Escape}")
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument())

    await openSheet(user)
    await waitFor(() => expect(screen.getByLabelText("Full name")).toHaveValue("Kept"))
    expect(screen.getByText(/Draft from/)).toBeInTheDocument()
    expect(screen.queryByText("Enter a 10-digit mobile number")).not.toBeInTheDocument()
  })

  it("shows a duplicate phone on the phone field, not as a vague toast", async () => {
    vi.mocked(createOwnerAction).mockResolvedValue({
      ok: false,
      error: { status: 409, code: "CONFLICT", message: "Owner with this phone already exists" },
    })
    const user = userEvent.setup()
    render(<CreateOwnerSheet />)
    await openSheet(user)
    await user.type(screen.getByLabelText("Full name"), "Dup Owner")
    await user.type(screen.getByLabelText("Phone"), "9876543210")
    await user.click(screen.getByRole("button", { name: "Create owner" }))

    expect(await screen.findByText("An owner with this phone number already exists.")).toBeInTheDocument()
    expect(toast.error).not.toHaveBeenCalled()
  })
})
