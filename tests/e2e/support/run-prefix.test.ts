import { describe, expect, it } from "vitest"
import { groupByRun, runPrefix } from "./run-prefix"

describe("runPrefix", () => {
  it("reads the run prefix from every kind of E2E staff email", () => {
    expect(runPrefix("e2e-mws0fybp-81262e-admin@example.com")).toBe("e2e-mws0fybp-81262e")
    expect(runPrefix("e2e-mws0fybp-81262e-sales@example.com")).toBe("e2e-mws0fybp-81262e")
    expect(runPrefix("e2e-mws0fybp-81262e-u07@example.com")).toBe("e2e-mws0fybp-81262e")
  })

  it("ignores real and system accounts", () => {
    expect(runPrefix("admin@example.com")).toBeNull()
    expect(runPrefix("website@system.autolead.local")).toBeNull()
    expect(runPrefix("e2e-lookalike@example.com")).toBeNull()
    expect(runPrefix("e2e-mws0fybp-81262e-admin@example.com.evil.test")).toBeNull()
  })
})

describe("groupByRun", () => {
  it("puts a run's admin, salesperson and extra staff in one group", () => {
    const users = [
      { id: "1", email: "e2e-aaa111-0a0b0c-admin@example.com" },
      { id: "2", email: "e2e-aaa111-0a0b0c-u04@example.com" },
      { id: "3", email: "e2e-bbb222-1a1b1c-admin@example.com" },
      { id: "4", email: "admin@example.com" },
    ]
    const runs = groupByRun(users)
    expect([...runs.keys()].sort()).toEqual(["e2e-aaa111-0a0b0c", "e2e-bbb222-1a1b1c"])
    expect(runs.get("e2e-aaa111-0a0b0c")?.map((u) => u.id)).toEqual(["1", "2"])
  })
})
