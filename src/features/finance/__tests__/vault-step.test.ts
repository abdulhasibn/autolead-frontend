import { describe, expect, it } from "vitest"
import { resolveVaultStep, vaultStepPath } from "../logic/vault-step"

describe("resolveVaultStep (api.md › Which screen to show)", () => {
  it.each([
    [{ initialized: false, confirmed: false, unlocked: false }, "setup"],
    // `confirmed`/`unlocked` don't matter when not initialised.
    [{ initialized: false, confirmed: true, unlocked: true }, "setup"],
    [{ initialized: true, confirmed: false, unlocked: false }, "confirm"],
    [{ initialized: true, confirmed: false, unlocked: true }, "confirm"],
    [{ initialized: true, confirmed: true, unlocked: false }, "unlock"],
    [{ initialized: true, confirmed: true, unlocked: true }, "ready"],
  ] as const)("%o → %s", (status, step) => {
    expect(resolveVaultStep(status)).toBe(step)
  })

  it("maps steps to routes, keeping a next link for unlock", () => {
    expect(vaultStepPath("setup")).toBe("/finance/setup")
    expect(vaultStepPath("confirm")).toBe("/finance/setup")
    expect(vaultStepPath("unlock")).toBe("/finance/unlock")
    expect(vaultStepPath("unlock", "/vehicles/1?tab=money")).toBe("/finance/unlock?next=%2Fvehicles%2F1%3Ftab%3Dmoney")
    expect(vaultStepPath("ready")).toBe("/finance")
    expect(vaultStepPath("ready", "/finance/entries")).toBe("/finance/entries")
  })
})
