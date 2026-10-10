import { describe, expect, it } from "vitest"
import { EMPTY_PREFERENCE_FORM } from "../preference"
import {
  completeFollowUpFormSchema,
  createLeadFormSchema,
  createLeadSchema,
  leadPreferenceFormSchema,
  leadPreferenceSchema,
  scheduleFollowUpFormSchema,
} from "../schemas"

const MAKE_ID = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa"
const MODEL_ID = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb"
const VARIANT_ID = "cccccccc-cccc-4ccc-8ccc-cccccccccccc"

const NO_PREFERENCE = {
  preferredMakeId: null,
  preferredModelId: null,
  preferredVariantId: null,
  preferredColours: [],
  preferredFuelTypes: [],
  preferredTransmissions: [],
  preferredBodyTypes: [],
  preferredYearMin: null,
  preferredYearMax: null,
  preferredKmMax: null,
  preferredMaxOwners: null,
}

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
  ...EMPTY_PREFERENCE_FORM,
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
      ...NO_PREFERENCE,
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

describe("leadPreferenceFormSchema", () => {
  it("turns an empty form into a cleared preference the API accepts", () => {
    const result = leadPreferenceFormSchema.parse(EMPTY_PREFERENCE_FORM)
    expect(result).toEqual(NO_PREFERENCE)
    expect(leadPreferenceSchema.safeParse(result).success).toBe(true)
  })

  it("converts numbers and keeps list picks", () => {
    const result = leadPreferenceFormSchema.parse({
      ...EMPTY_PREFERENCE_FORM,
      preferredColours: ["white", "silver"],
      preferredFuelTypes: ["petrol", "cng"],
      preferredBodyTypes: ["hatchback"],
      preferredYearMin: "2018",
      preferredKmMax: "60000",
      preferredMaxOwners: "0",
    })
    expect(result).toMatchObject({
      preferredColours: ["white", "silver"],
      preferredFuelTypes: ["petrol", "cng"],
      preferredBodyTypes: ["hatchback"],
      preferredYearMin: 2018,
      preferredYearMax: null,
      preferredKmMax: 60000,
      preferredMaxOwners: 0,
    })
    expect(leadPreferenceSchema.safeParse(result).success).toBe(true)
  })

  it("sends only the narrowest catalog pick", () => {
    const all = { preferredMakeId: MAKE_ID, preferredModelId: MODEL_ID }
    expect(
      leadPreferenceFormSchema.parse({ ...EMPTY_PREFERENCE_FORM, ...all, preferredVariantId: VARIANT_ID })
    ).toMatchObject({ preferredMakeId: null, preferredModelId: null, preferredVariantId: VARIANT_ID })
    expect(leadPreferenceFormSchema.parse({ ...EMPTY_PREFERENCE_FORM, ...all })).toMatchObject({
      preferredMakeId: null,
      preferredModelId: MODEL_ID,
    })
    expect(
      leadPreferenceFormSchema.parse({ ...EMPTY_PREFERENCE_FORM, preferredMakeId: MAKE_ID })
    ).toMatchObject({ preferredMakeId: MAKE_ID })
  })

  it("rejects a year window that runs backwards", () => {
    const result = leadPreferenceFormSchema.safeParse({
      ...EMPTY_PREFERENCE_FORM,
      preferredYearMin: "2022",
      preferredYearMax: "2018",
    })
    expect(result.success).toBe(false)
    expect(result.error!.issues[0]!.path).toEqual(["preferredYearMax"])
  })

  it("rejects out-of-range and non-whole numbers", () => {
    const result = leadPreferenceFormSchema.safeParse({
      ...EMPTY_PREFERENCE_FORM,
      preferredYearMin: "1900",
      preferredKmMax: "-1",
      preferredMaxOwners: "1.5",
    })
    expect(result.success).toBe(false)
    const fields = result.error!.issues.map((i) => i.path[0])
    expect(fields).toEqual(
      expect.arrayContaining(["preferredYearMin", "preferredKmMax", "preferredMaxOwners"])
    )
  })

  it("caps colours at 20", () => {
    const colours = Array.from({ length: 21 }, (_, i) => `colour ${i}`)
    expect(
      leadPreferenceFormSchema.safeParse({ ...EMPTY_PREFERENCE_FORM, preferredColours: colours })
        .success
    ).toBe(false)
  })
})

describe("leadPreferenceSchema", () => {
  it("lower-cases colours like the API stores them", () => {
    const result = leadPreferenceSchema.parse({ ...NO_PREFERENCE, preferredColours: [" Pearl White "] })
    expect(result.preferredColours).toEqual(["pearl white"])
  })

  it("rejects unknown enum values", () => {
    expect(
      leadPreferenceSchema.safeParse({ ...NO_PREFERENCE, preferredFuelTypes: ["steam"] }).success
    ).toBe(false)
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

describe("completeFollowUpFormSchema", () => {
  const base = {
    outcome: "reached" as const,
    notes: "  Liked the car  ",
    scheduleNext: false,
    next: { scheduledAt: "", taskType: "call" as const, notes: "" },
  }

  it("ignores the next follow-up fields unless asked", () => {
    expect(completeFollowUpFormSchema.parse(base)).toEqual({
      outcome: "reached",
      notes: "Liked the car",
      next: null,
    })
  })

  it("builds the next follow-up when asked", () => {
    const result = completeFollowUpFormSchema.parse({
      ...base,
      scheduleNext: true,
      next: { scheduledAt: "2026-10-12T09:00", taskType: "meeting", notes: "" },
    })
    expect(result.next).toEqual({
      scheduledAt: new Date("2026-10-12T09:00").toISOString(),
      taskType: "meeting",
      notes: null,
    })
  })

  it("requires a date for the next follow-up", () => {
    const parsed = completeFollowUpFormSchema.safeParse({ ...base, scheduleNext: true })
    expect(parsed.success).toBe(false)
    expect(parsed.error?.issues[0]?.path).toEqual(["next", "scheduledAt"])
  })
})
