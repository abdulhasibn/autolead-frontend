import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

const unlockAction = vi.fn()
const recoverAction = vi.fn()
const replace = vi.fn()
const refresh = vi.fn()

vi.mock("../actions", () => ({
  unlockAction: (...a: unknown[]) => unlockAction(...a),
  recoverAction: (...a: unknown[]) => recoverAction(...a),
}))
vi.mock("next/navigation", () => ({ useRouter: () => ({ replace, refresh, push: vi.fn() }) }))
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

import { UnlockForm } from "../components/vault/unlock-form"
import { KeyDisplay } from "../components/key-display"

const KEY = "FK-ABCD-EFGH-JKMN-PQRS-TVWX-YZ12"
const RECOVERY = "RK-1111-2222-3333-4444-5555-6666-7777-8888-9999-AAAA-BBBB-CCCC"

function storageWrites() {
  return [
    vi.spyOn(Storage.prototype, "setItem"),
    vi.spyOn(document, "cookie", "set"),
  ] as const
}

describe("finance keys never persist in the browser", () => {
  beforeEach(() => {
    localStorage.clear()
    sessionStorage.clear()
    vi.clearAllMocks()
  })
  afterEach(() => vi.restoreAllMocks())

  it("unlock: sends the key once, clears the field, writes nothing to storage", async () => {
    const [setItem, setCookie] = storageWrites()
    unlockAction.mockResolvedValue({ ok: true, data: { expiresAt: "2026-11-08T10:30:00.000Z" } })
    const user = userEvent.setup()
    render(<UnlockForm next="/finance/entries" />)

    const field = screen.getByLabelText("Finance key") as HTMLInputElement
    expect(field).toHaveAttribute("autocomplete", "off")
    await user.type(field, KEY)
    await user.click(screen.getByRole("button", { name: "Unlock" }))

    expect(unlockAction).toHaveBeenCalledWith({ financeKey: KEY })
    expect(field.value).toBe("")
    expect(replace).toHaveBeenCalledWith("/finance/entries")
    expect(setItem).not.toHaveBeenCalled()
    expect(setCookie).not.toHaveBeenCalled()
    expect(localStorage.length).toBe(0)
    expect(sessionStorage.length).toBe(0)
    expect(document.cookie).not.toContain(KEY)
    expect(window.location.href).not.toContain("FK-")
  })

  it("unlock: a wrong key shows the message and the field is still cleared", async () => {
    unlockAction.mockResolvedValue({
      ok: false,
      error: { status: 422, code: "INVALID_FINANCE_KEY", message: "nope" },
    })
    const user = userEvent.setup()
    render(<UnlockForm next="/finance" />)
    const field = screen.getByLabelText("Finance key") as HTMLInputElement
    await user.type(field, KEY)
    await user.click(screen.getByRole("button", { name: "Unlock" }))
    expect(await screen.findByText("That key didn't open the vault.")).toBeInTheDocument()
    expect(field.value).toBe("")
  })

  it("unlock: a malformed key gets the shape message; lockout disables entry", async () => {
    const user = userEvent.setup()
    render(<UnlockForm next="/finance" />)
    const field = screen.getByLabelText("Finance key") as HTMLInputElement

    unlockAction.mockResolvedValueOnce({ ok: false, error: { status: 422, code: "VALIDATION_ERROR", message: "bad" } })
    await user.type(field, "hello")
    await user.click(screen.getByRole("button", { name: "Unlock" }))
    expect(await screen.findByText("That doesn't look like a finance key.")).toBeInTheDocument()

    unlockAction.mockResolvedValueOnce({
      ok: false,
      error: { status: 429, code: "FINANCE_UNLOCK_BLOCKED", message: "Try again in 14 minutes." },
    })
    await user.type(field, KEY)
    await user.click(screen.getByRole("button", { name: "Unlock" }))
    expect(await screen.findByText("Try again in 14 minutes.")).toBeInTheDocument()
    expect(field).toBeDisabled()
  })

  it("recover: new keys are shown, then dropped when the admin moves on", async () => {
    const [setItem] = storageWrites()
    recoverAction.mockResolvedValue({ ok: true, data: { financeKey: KEY, recoveryKey: RECOVERY } })
    const user = userEvent.setup()
    render(<UnlockForm next="/finance" />)
    await user.click(screen.getByRole("button", { name: "Lost your key? Recover" }))
    await user.type(screen.getByLabelText("Recovery key"), RECOVERY)
    await user.click(screen.getByRole("button", { name: "Recover" }))

    expect(await screen.findByText(KEY)).toBeInTheDocument()
    await user.click(screen.getByRole("button", { name: /unlock now/ }))
    expect(screen.queryByText(KEY)).not.toBeInTheDocument()
    expect(screen.queryByText(RECOVERY)).not.toBeInTheDocument()
    expect(setItem).not.toHaveBeenCalled()
  })

  it("key display: copy uses the clipboard only", async () => {
    const [setItem, setCookie] = storageWrites()
    const user = userEvent.setup()
    const writeText = vi.spyOn(navigator.clipboard, "writeText").mockResolvedValue()
    render(<KeyDisplay keys={[{ label: "Finance key", value: KEY }]} />)
    await user.click(screen.getByRole("button", { name: "Copy" }))
    expect(writeText).toHaveBeenCalledWith(KEY)
    expect(setItem).not.toHaveBeenCalled()
    expect(setCookie).not.toHaveBeenCalled()
  })
})
