import { describe, expect, it, vi } from "vitest"
import { OWNER_PHONE_TAKEN, showOwnerPhoneConflict } from "../conflicts"

const error = (status: number) => ({ status, code: "CONFLICT", message: "Owner with this phone already exists" })

describe("showOwnerPhoneConflict", () => {
  it("puts a clear message on the phone field for a 409", () => {
    const setError = vi.fn()
    expect(showOwnerPhoneConflict(error(409), setError)).toBe(true)
    expect(setError).toHaveBeenCalledWith(
      "phone",
      { type: "server", message: OWNER_PHONE_TAKEN },
      { shouldFocus: true }
    )
  })

  it("leaves other errors to the caller", () => {
    const setError = vi.fn()
    expect(showOwnerPhoneConflict(error(503), setError)).toBe(false)
    expect(setError).not.toHaveBeenCalled()
  })
})
