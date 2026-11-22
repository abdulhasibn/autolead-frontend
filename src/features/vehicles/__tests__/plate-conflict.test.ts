import { describe, expect, it, vi } from "vitest"
import { PLATE_TAKEN, showPlateConflict } from "../components/plate-conflict"

const error = (status: number) => ({ status, code: "CONFLICT", message: "x" })

describe("showPlateConflict", () => {
  it("goes back to the plate step and marks the plate field for a 409", () => {
    const setError = vi.fn()
    const goToPlateStep = vi.fn()
    expect(showPlateConflict(error(409), setError, goToPlateStep)).toBe(true)
    expect(goToPlateStep).toHaveBeenCalledOnce()
    expect(setError).toHaveBeenCalledWith(
      "registrationNumber",
      { type: "server", message: PLATE_TAKEN },
      { shouldFocus: true }
    )
  })

  it("does nothing for other errors", () => {
    const setError = vi.fn()
    const goToPlateStep = vi.fn()
    expect(showPlateConflict(error(500), setError, goToPlateStep)).toBe(false)
    expect(goToPlateStep).not.toHaveBeenCalled()
    expect(setError).not.toHaveBeenCalled()
  })
})
