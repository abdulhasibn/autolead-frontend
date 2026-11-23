import { describe, expect, it } from "vitest"
import { EMPTY_PREFERENCE_FORM } from "../preference"
import { buildSuggestPayload, WIZARD_SUGGESTION_MIN_SCORE } from "../suggest-payload"

const form = (over: Record<string, unknown> = {}) =>
  ({ budget: "", ...EMPTY_PREFERENCE_FORM, ...over }) as Parameters<typeof buildSuggestPayload>[0]

describe("buildSuggestPayload", () => {
  it("reads a budget typed with Indian grouping", () => {
    const draft = buildSuggestPayload(form({ budget: "9,00,000" }))
    expect(draft.kind).toBe("ready")
    if (draft.kind === "ready") expect(draft.payload.budget).toBe(900000)
  })

  it("reads a plain budget and one padded with spaces", () => {
    for (const budget of ["900000", " 9,00,000 "]) {
      const draft = buildSuggestPayload(form({ budget }))
      expect(draft.kind === "ready" && draft.payload.budget).toBe(900000)
    }
  })

  it("is empty with no budget and no preference", () => {
    expect(buildSuggestPayload(form()).kind).toBe("empty")
  })

  it("is invalid for a budget that is not a number", () => {
    expect(buildSuggestPayload(form({ budget: "abc" })).kind).toBe("invalid")
  })

  it("is ready for a preference alone, with null budget", () => {
    const draft = buildSuggestPayload(form({ preferredFuelTypes: ["petrol"] }))
    expect(draft.kind === "ready" && draft.payload.budget).toBeNull()
  })

  it("lower-cases and trims colours, and keys the payload", () => {
    const draft = buildSuggestPayload(form({ budget: "5", preferredColours: [" White "] }))
    expect(draft.kind === "ready" && draft.payload.preferredColours).toEqual(["white"])
    expect(draft.kind === "ready" && draft.key).toContain('"white"')
  })

  it("lists partial matches in the wizard (below the lead page's 60)", () => {
    expect(WIZARD_SUGGESTION_MIN_SCORE).toBeLessThan(60)
  })
})
