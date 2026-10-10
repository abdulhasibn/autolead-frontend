import { z } from "zod"
import { FUEL_TYPES, TRANSMISSIONS } from "@/features/vehicles/constants"
import {
  BODY_TYPES,
  FOLLOW_UP_TASK_TYPES,
  LEAD_SOURCES,
  LEAD_STATUSES,
  PREFERRED_COLOUR_MAX_LENGTH,
  PREFERRED_COLOURS_MAX,
  PREFERRED_YEAR_MAX,
  PREFERRED_YEAR_MIN,
} from "./constants"

// Matches the backend Phone value object: "+" then 7–15 digits.
const e164Regex = /^\+[1-9]\d{6,14}$/
const phoneMessage = "Enter a valid E.164 phone number (e.g. +919876543210)"

const yearMessage = `Enter a year between ${PREFERRED_YEAR_MIN} and ${PREFERRED_YEAR_MAX}`
const yearOrderMessage = "Must be the same as or after the 'from' year"

function yearsInOrder(value: {
  preferredYearMin?: number | null
  preferredYearMax?: number | null
}): boolean {
  return (
    value.preferredYearMin == null ||
    value.preferredYearMax == null ||
    value.preferredYearMin <= value.preferredYearMax
  )
}

// ---------------------------------------------------------------------------
// API payloads — validated again inside Server Actions before hitting the API
// ---------------------------------------------------------------------------

const preferenceFields = {
  preferredMakeId: z.guid().nullable(),
  preferredModelId: z.guid().nullable(),
  preferredVariantId: z.guid().nullable(),
  preferredColours: z
    .array(z.string().trim().toLowerCase().min(1).max(PREFERRED_COLOUR_MAX_LENGTH))
    .max(PREFERRED_COLOURS_MAX),
  preferredFuelTypes: z.array(z.enum(FUEL_TYPES)),
  preferredTransmissions: z.array(z.enum(TRANSMISSIONS)),
  preferredBodyTypes: z.array(z.enum(BODY_TYPES)),
  preferredYearMin: z.int().min(PREFERRED_YEAR_MIN).max(PREFERRED_YEAR_MAX).nullable(),
  preferredYearMax: z.int().min(PREFERRED_YEAR_MIN).max(PREFERRED_YEAR_MAX).nullable(),
  preferredKmMax: z.int().nonnegative().nullable(),
  preferredMaxOwners: z.int().nonnegative().nullable(),
}

/** PUT /leads/:id/preference is a full replace, so every field is required. */
export const leadPreferenceSchema = z
  .object(preferenceFields)
  .refine(yearsInOrder, { message: yearOrderMessage, path: ["preferredYearMax"] })

export type LeadPreferenceInput = z.infer<typeof leadPreferenceSchema>

export const createLeadSchema = z.object({
  showroomId: z.guid().nullable().optional(),
  fullName: z.string().trim().min(1, "Full name is required"),
  phone: z.string().trim().regex(e164Regex, phoneMessage),
  email: z.email().nullable().optional(),
  source: z.enum(LEAD_SOURCES),
  vehicleId: z.guid().nullable().optional(),
  budget: z.number().nonnegative().nullable().optional(),
  preferredVehicle: z.string().nullable().optional(),
  purchaseTimeline: z.string().nullable().optional(),
  financeRequired: z.boolean().nullable().optional(),
  currentVehicle: z.string().nullable().optional(),
  tradeInRequired: z.boolean().nullable().optional(),
  notes: z.string().nullable().optional(),
  ...z.object(preferenceFields).partial().shape,
}).refine(yearsInOrder, { message: yearOrderMessage, path: ["preferredYearMax"] })

export type CreateLeadInput = z.infer<typeof createLeadSchema>

export const changeLeadStatusSchema = z.object({
  status: z.enum(LEAD_STATUSES),
  notes: z.string().nullable().optional(),
})

export type ChangeLeadStatusInput = z.infer<typeof changeLeadStatusSchema>

export const scheduleFollowUpSchema = z.object({
  scheduledAt: z.iso.datetime({ message: "Enter a valid date/time" }),
  taskType: z.enum(FOLLOW_UP_TASK_TYPES),
  notes: z.string().nullable().optional(),
})

export type ScheduleFollowUpInput = z.infer<typeof scheduleFollowUpSchema>

export const associateVehicleSchema = z.object({
  vehicleId: z.guid("Select a vehicle"),
})

export type AssociateVehicleInput = z.infer<typeof associateVehicleSchema>

// ---------------------------------------------------------------------------
// Form schemas — raw string inputs in, API payloads out
// ---------------------------------------------------------------------------

const optionalText = z
  .string()
  .trim()
  .transform((value) => (value === "" ? null : value))

const yesNoUnknown = z
  .enum(["", "yes", "no"])
  .transform((value) => (value === "" ? null : value === "yes"))

/** Optional whole number in [min, max]; "" means no limit. */
function optionalInt(message: string, min = 0, max = Number.MAX_SAFE_INTEGER) {
  return z
    .string()
    .trim()
    .refine(
      (value) =>
        value === "" || (/^\d+$/.test(value) && Number(value) >= min && Number(value) <= max),
      message
    )
    .transform((value) => (value === "" ? null : Number(value)))
}

const preferenceFormFields = {
  preferredMakeId: optionalText,
  preferredModelId: optionalText,
  preferredVariantId: optionalText,
  preferredColours: z
    .array(z.string())
    .max(PREFERRED_COLOURS_MAX, `Add at most ${PREFERRED_COLOURS_MAX} colours`),
  preferredFuelTypes: z.array(z.enum(FUEL_TYPES)),
  preferredTransmissions: z.array(z.enum(TRANSMISSIONS)),
  preferredBodyTypes: z.array(z.enum(BODY_TYPES)),
  preferredYearMin: optionalInt(yearMessage, PREFERRED_YEAR_MIN, PREFERRED_YEAR_MAX),
  preferredYearMax: optionalInt(yearMessage, PREFERRED_YEAR_MIN, PREFERRED_YEAR_MAX),
  preferredKmMax: optionalInt("Enter a whole number of km"),
  preferredMaxOwners: optionalInt("Enter a whole number (0 = first owner only)"),
}

/**
 * The API fills in catalog parents itself, so only the narrowest pick is
 * sent (a model without its make, a variant without either).
 */
function narrowestCatalogPick<
  T extends {
    preferredMakeId: string | null
    preferredModelId: string | null
    preferredVariantId: string | null
  },
>(value: T): T {
  if (value.preferredVariantId) {
    return { ...value, preferredMakeId: null, preferredModelId: null }
  }
  if (value.preferredModelId) return { ...value, preferredMakeId: null }
  return value
}

export const leadPreferenceFormSchema = z
  .object(preferenceFormFields)
  .refine(yearsInOrder, { message: yearOrderMessage, path: ["preferredYearMax"] })
  .transform(narrowestCatalogPick)

export type LeadPreferenceFormInput = z.input<typeof leadPreferenceFormSchema>

export const createLeadFormSchema = z.object({
  fullName: z.string().trim().min(1, "Full name is required"),
  phone: z.string().trim().regex(e164Regex, phoneMessage),
  email: z
    .string()
    .trim()
    .pipe(z.union([z.literal(""), z.email("Enter a valid email address")]))
    .transform((value) => (value === "" ? null : value)),
  source: z.enum(LEAD_SOURCES, { error: "Select a source" }),
  vehicleId: optionalText,
  budget: z
    .string()
    .trim()
    .refine(
      (value) => value === "" || (Number.isFinite(Number(value)) && Number(value) >= 0),
      "Enter a valid amount"
    )
    .transform((value) => (value === "" ? null : Number(value))),
  preferredVehicle: optionalText,
  purchaseTimeline: optionalText,
  currentVehicle: optionalText,
  financeRequired: yesNoUnknown,
  tradeInRequired: yesNoUnknown,
  notes: optionalText,
  ...preferenceFormFields,
})
  .refine(yearsInOrder, { message: yearOrderMessage, path: ["preferredYearMax"] })
  .transform(narrowestCatalogPick)

export type CreateLeadFormInput = z.input<typeof createLeadFormSchema>

export const changeLeadStatusFormSchema = z.object({
  status: z.enum(LEAD_STATUSES, { error: "Select a status" }),
  notes: optionalText,
})

export type ChangeLeadStatusFormInput = z.input<typeof changeLeadStatusFormSchema>

export const scheduleFollowUpFormSchema = z.object({
  // `<input type="datetime-local">` yields local time without an offset
  // ("2026-10-05T10:00"); convert it to an ISO timestamp for the API.
  scheduledAt: z
    .string()
    .min(1, "Pick a date and time")
    .refine((value) => !Number.isNaN(new Date(value).getTime()), "Enter a valid date/time")
    .transform((value) => new Date(value).toISOString()),
  taskType: z.enum(FOLLOW_UP_TASK_TYPES, { error: "Select a task type" }),
  notes: optionalText,
})

export type ScheduleFollowUpFormInput = z.input<typeof scheduleFollowUpFormSchema>
