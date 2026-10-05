import { describe, expect, it } from "vitest"
import {
  createLeadFormSchema,
  createLeadSchema,
  scheduleFollowUpFormSchema,
} from "../schemas"

const baseForm = {
  fullName: " Asha Menon ",
  phone: "+919876543210",
  email: "",
  source: "walkin" as const,
  vehicleId: "",
  budget: "",
  preferredVehicle: "",
  purchaseTimeline: "",
  currentVehicle: "",
  financeRequired: "" as const,
  tradeInRequired: "" as const,
  notes: "",
}

describe("createLeadFormSchema", () => {
  it("turns blank optional fields into nulls", () => {
    const result = createLeadFormSchema.parse(baseForm)
    expect(result).toEqual({
      fullName: "Asha Menon",
      phone: "+919876543210",
      email: null,
      source: "walkin",
      vehicleId: null,
      budget: null,
      preferredVehicle: null,
      purchaseTimeline: null,
      currentVehicle: null,
      financeRequired: null,
      tradeInRequired: null,
      notes: null,
    })
    // and the output is a valid API payload
    expect(createLeadSchema.safeParse(result).success).toBe(true)
  })

  it("converts budget and yes/no answers", () => {
    const result = createLeadFormSchema.parse({
      ...baseForm,
      budget: "650000",
      financeRequired: "yes",
      tradeInRequired: "no",
    })
    expect(result.budget).toBe(650000)
    expect(result.financeRequired).toBe(true)
    expect(result.tradeInRequired).toBe(false)
  })

  it("rejects bad phone, email, budget and missing source", () => {
    const result = createLeadFormSchema.safeParse({
      ...baseForm,
      phone: "9876543210",
      email: "nope",
      budget: "-5",
      source: "",
    })
    expect(result.success).toBe(false)
    const fields = result.error!.issues.map((i) => i.path[0])
    expect(fields).toEqual(expect.arrayContaining(["phone", "email", "budget", "source"]))
  })
})

describe("scheduleFollowUpFormSchema", () => {
  it("converts datetime-local input to an ISO timestamp", () => {
    const result = scheduleFollowUpFormSchema.parse({
      scheduledAt: "2026-10-05T10:30",
      taskType: "call",
      notes: "",
    })
    expect(result.scheduledAt).toBe(new Date("2026-10-05T10:30").toISOString())
    expect(result.notes).toBeNull()
  })

  it("requires a date", () => {
    expect(
      scheduleFollowUpFormSchema.safeParse({ scheduledAt: "", taskType: "call", notes: "" })
        .success
    ).toBe(false)
  })
})
