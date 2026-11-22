import { describe, expect, it } from "vitest"
import { assignLeadSchema, editLeadFormSchema, updateLeadSchema } from "../schemas"

const FORM = {
  fullName: "  Asha Rao ",
  phone: "98765 43210",
  email: "",
  source: "walkin" as const,
  budget: "650000",
  purchaseTimeline: "",
  currentVehicle: "2015 Swift",
  financeRequired: "yes" as const,
  tradeInRequired: "" as const,
  notes: "  ",
}

describe("editLeadFormSchema (#21)", () => {
  it("turns the form into a full PATCH body the API accepts", () => {
    const parsed = editLeadFormSchema.parse(FORM)

    expect(parsed).toEqual({
      fullName: "Asha Rao",
      phone: "+919876543210",
      email: null,
      source: "walkin",
      budget: 650000,
      purchaseTimeline: null,
      currentVehicle: "2015 Swift",
      financeRequired: true,
      tradeInRequired: null,
      notes: null,
    })
    // Every field present, so nothing is cleared by accident.
    expect(updateLeadSchema.safeParse(parsed).success).toBe(true)
  })

  it("keeps an older source staff can no longer pick for new leads", () => {
    expect(editLeadFormSchema.parse({ ...FORM, source: "marketplace" }).source).toBe("marketplace")
  })

  it("rejects an empty name, a bad phone and a bad budget", () => {
    const result = editLeadFormSchema.safeParse({ ...FORM, fullName: " ", phone: "123", budget: "-5" })
    expect(result.success).toBe(false)
    const paths = result.error?.issues.map((i) => i.path[0])
    expect(paths).toEqual(expect.arrayContaining(["fullName", "phone", "budget"]))
  })
})

describe("assignLeadSchema", () => {
  it("accepts a staff id or null to unassign", () => {
    expect(assignLeadSchema.safeParse({ assignedTo: null }).success).toBe(true)
    expect(
      assignLeadSchema.safeParse({ assignedTo: "11111111-1111-4111-8111-111111111111" }).success
    ).toBe(true)
    expect(assignLeadSchema.safeParse({ assignedTo: "nope" }).success).toBe(false)
  })
})
