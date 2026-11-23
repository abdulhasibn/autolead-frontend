import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"

const unlockAction = vi.fn()

vi.mock("../actions", () => ({ unlockAction: (...a: unknown[]) => unlockAction(...a), recoverAction: vi.fn() }))
vi.mock("next/navigation", () => ({ useRouter: () => ({ replace: vi.fn(), refresh: vi.fn(), push: vi.fn() }) }))

import { ApiError } from "@/lib/api-error"
import { actionError } from "@/lib/action-result"
import { UnlockForm } from "../components/vault/unlock-form"
import { attemptsLeftFrom, triesLeftMessage } from "../logic/errors"

const wrongKey = (attemptsLeft?: number) => ({
  ok: false,
  error: {
    status: 422,
    code: "INVALID_FINANCE_KEY",
    message: "The key is not correct",
    ...(attemptsLeft === undefined ? {} : { details: { attemptsLeft } }),
  },
})

async function tryKey(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText("Finance key"), "FK-AAAA-BBBB-CCCC-DDDD-EEEE-FFFF")
  await user.click(screen.getByRole("button", { name: "Unlock" }))
}

describe("tries left before the unlock pause", () => {
  beforeEach(() => vi.clearAllMocks())

  it("says how many tries are left after a wrong key", async () => {
    unlockAction.mockResolvedValue(wrongKey(2))
    const user = userEvent.setup()
    render(<UnlockForm next="/finance" />)

    await tryKey(user)

    expect(await screen.findByText("That key didn't open the vault.")).toBeInTheDocument()
    expect(screen.getByText("2 tries left before a 15-minute pause.")).toBeInTheDocument()
    expect(screen.getByText(/\d+ (tries|attempts) left/i)).toBeInTheDocument()
  })

  it("shows the pause, not a count, when that was the last try", async () => {
    unlockAction.mockResolvedValue(wrongKey(0))
    const user = userEvent.setup()
    render(<UnlockForm next="/finance" />)

    await tryKey(user)

    expect(await screen.findByText(/paused for 15 minutes/i)).toBeInTheDocument()
    expect(screen.queryByText(/tries left/i)).toBeNull()
    expect(screen.getByLabelText("Finance key")).toBeDisabled()
  })

  it("still shows the plain error when the server sends no count", async () => {
    unlockAction.mockResolvedValue(wrongKey())
    const user = userEvent.setup()
    render(<UnlockForm next="/finance" />)

    await tryKey(user)

    expect(await screen.findByText("That key didn't open the vault.")).toBeInTheDocument()
    expect(screen.queryByText(/left before/i)).toBeNull()
  })
})

describe("tries-left helpers", () => {
  it("uses the singular for one try", () => {
    expect(triesLeftMessage(1)).toBe("1 try left before a 15-minute pause.")
    expect(triesLeftMessage(4)).toBe("4 tries left before a 15-minute pause.")
  })

  it("reads attemptsLeft only from a wrong-key error", () => {
    expect(attemptsLeftFrom({ code: "INVALID_FINANCE_KEY", details: { attemptsLeft: 3 } })).toBe(3)
    expect(attemptsLeftFrom({ code: "INVALID_FINANCE_KEY", details: { attemptsLeft: "x" } })).toBeNull()
    expect(attemptsLeftFrom({ code: "INVALID_FINANCE_KEY" })).toBeNull()
    expect(attemptsLeftFrom({ code: "VALIDATION_ERROR", details: { attemptsLeft: 3 } })).toBeNull()
  })

  it("carries error details through ApiError into the action result", () => {
    const err = new ApiError(422, "INVALID_FINANCE_KEY", "The key is not correct", { attemptsLeft: 4 })
    expect(actionError(err)).toEqual({
      ok: false,
      error: { status: 422, code: "INVALID_FINANCE_KEY", message: "The key is not correct", details: { attemptsLeft: 4 } },
    })
    expect(actionError(new ApiError(404, "NOT_FOUND", "x"))).toEqual({
      ok: false,
      error: { status: 404, code: "NOT_FOUND", message: "x" },
    })
  })
})
