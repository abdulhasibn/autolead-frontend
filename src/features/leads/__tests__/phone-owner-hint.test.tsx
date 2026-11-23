import { act, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

const lookup = vi.fn()
vi.mock("../actions", () => ({ lookupContactByPhoneAction: (phone: string) => lookup(phone) }))

import { PhoneOwnerHint } from "../components/phone-owner-hint"

async function settle() {
  await act(async () => {
    vi.advanceTimersByTime(450)
  })
}

describe("PhoneOwnerHint", () => {
  beforeEach(() => {
    vi.useFakeTimers()
    lookup.mockReset()
  })
  afterEach(() => vi.useRealTimers())

  it("names the contact for admins and offers to use that name", async () => {
    lookup.mockResolvedValue({ ok: true, data: { exists: true, contact: { id: "c1", fullName: "Priya Shah" } } })
    const onUseName = vi.fn()
    render(<PhoneOwnerHint phone="98111 22233" onUseName={onUseName} />)
    await settle()

    expect(lookup).toHaveBeenCalledWith("+919811122233")
    expect(screen.getByRole("status")).toHaveTextContent("This number belongs to Priya Shah")
    vi.useRealTimers()
    await userEvent.click(screen.getByRole("button", { name: "Use this name" }))
    expect(onUseName).toHaveBeenCalledWith("Priya Shah")
  })

  it("tells a salesperson the number is taken without a name", async () => {
    lookup.mockResolvedValue({ ok: true, data: { exists: true, contact: null } })
    render(<PhoneOwnerHint phone="9811122233" onUseName={vi.fn()} />)
    await settle()

    expect(screen.getByRole("status")).toHaveTextContent("This number already belongs to a contact")
    expect(screen.queryByRole("button", { name: "Use this name" })).not.toBeInTheDocument()
  })

  it("shows nothing for a new number", async () => {
    lookup.mockResolvedValue({ ok: true, data: { exists: false, contact: null } })
    render(<PhoneOwnerHint phone="9800000009" onUseName={vi.fn()} />)
    await settle()
    expect(screen.queryByRole("status")).not.toBeInTheDocument()
  })

  it("doesn't look up a number that isn't a full mobile yet", async () => {
    render(<PhoneOwnerHint phone="98111" onUseName={vi.fn()} />)
    await settle()
    expect(lookup).not.toHaveBeenCalled()
    expect(screen.queryByRole("status")).not.toBeInTheDocument()
  })
})
