import { act, renderHook } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

const revokeSessionAction = vi.fn()
const signOut = vi.fn()
const toastError = vi.fn()

vi.mock("../actions", () => ({ revokeSessionAction: (...a: unknown[]) => revokeSessionAction(...a) }))
vi.mock("next-auth/react", () => ({ signOut: (...a: unknown[]) => signOut(...a) }))
vi.mock("sonner", () => ({
  toast: { loading: () => "toast-id", error: (...a: unknown[]) => toastError(...a) },
}))

import { useSignOut } from "../use-sign-out"

const FAILED = {
  ok: false,
  error: { status: 503, code: "DB_UNAVAILABLE", message: "down" },
} as const

describe("useSignOut", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    signOut.mockResolvedValue(undefined)
  })

  it.each(["local", "global"] as const)(
    "revokes the %s backend session, then clears the next-auth session",
    async (scope) => {
      revokeSessionAction.mockResolvedValue({ ok: true, data: undefined })
      const { result } = renderHook(() => useSignOut())

      await act(() => result.current.signOutWith(scope))

      expect(revokeSessionAction).toHaveBeenCalledWith(scope)
      expect(signOut).toHaveBeenCalledWith({ redirectTo: "/login" })
      expect(revokeSessionAction.mock.invocationCallOrder[0]).toBeLessThan(
        signOut.mock.invocationCallOrder[0]!
      )
    }
  )

  it("still signs out on this device when the API call fails", async () => {
    revokeSessionAction.mockResolvedValue(FAILED)
    const { result } = renderHook(() => useSignOut())

    await act(() => result.current.signOutWith("local"))

    expect(signOut).toHaveBeenCalled()
    expect(toastError).not.toHaveBeenCalled()
  })

  it("stays signed in and reports it when signing out everywhere fails", async () => {
    revokeSessionAction.mockResolvedValue(FAILED)
    const { result } = renderHook(() => useSignOut())

    await act(() => result.current.signOutWith("global"))

    expect(signOut).not.toHaveBeenCalled()
    expect(toastError).toHaveBeenCalled()
    expect(result.current.pending).toBeNull()
  })
})
