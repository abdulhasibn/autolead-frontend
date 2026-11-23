import { z } from "zod"
import { FUEL_TYPES, TRANSMISSIONS } from "@/features/vehicles/constants"
import {
  BODY_TYPES,
  FOLLOW_UP_OUTCOMES,
  FOLLOW_UP_TASK_TYPES,
  LEAD_SOURCES,
  SELECTABLE_LEAD_SOURCES,
  LEAD_STATUSES,
  MAX_BUDGET,
  PREFERRED_COLOUR_MAX_LENGTH,
  PREFERRED_COLOURS_MAX,
  PREFERRED_YEAR_MAX,
  PREFERRED_YEAR_MIN,
} from "./constants"
import { E164_REGEX, indianPhoneFormSchema } from "@/lib/phone"

const phoneMessage = "Enter a valid phone number"

const yearMessage = `Enter a year between ${PREFERRED_YEAR_MIN} and ${PREFERRED_YEAR_MAX}`

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
  preferredKmMax: z.int().nonnegative().nullable(),
  preferredMaxOwners: z.int().nonnegative().nullable(),
}

/** PUT /leads/:id/preference is a full replace, so every field is required. */
export const leadPreferenceSchema = z
  .object(preferenceFields)

export type LeadPreferenceInput = z.infer<typeof leadPreferenceSchema>

export const createLeadSchema = z.object({
  showroomId: z.guid().nullable().optional(),
  fullName: z.string().trim().min(1, "Full name is required"),
  phone: z.string().trim().regex(E164_REGEX, phoneMessage),
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
})

export type CreateLeadInput = z.infer<typeof createLeadSchema>

/**
 * PATCH /leads/:id is a full replace of the CRM fields: anything optional that
 * is left out is cleared, so the edit form always sends every field.
 */
export const updateLeadSchema = z.object({
  fullName: z.string().trim().min(1, "Full name is required"),
  phone: z.string().trim().regex(E164_REGEX, phoneMessage),
  email: z.email().nullable(),
  source: z.enum(LEAD_SOURCES),
  budget: z.number().nonnegative().nullable(),
  purchaseTimeline: z.string().nullable(),
  financeRequired: z.boolean().nullable(),
  currentVehicle: z.string().nullable(),
  tradeInRequired: z.boolean().nullable(),
  notes: z.string().nullable(),
})

export type UpdateLeadInput = z.infer<typeof updateLeadSchema>

/** PUT /leads/:id/assignment: a staff member's id, or null to unassign. */
export const assignLeadSchema = z.object({
  assignedTo: z.guid().nullable(),
})

export type AssignLeadInput = z.infer<typeof assignLeadSchema>

/** POST /leads/vehicle-suggestions: score stock against preferences before a lead exists. */
export const suggestVehiclesSchema = z
  .object({
    budget: z.number().nonnegative().nullable(),
    ...preferenceFields,
  })

export type SuggestVehiclesInput = z.infer<typeof suggestVehiclesSchema>

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

export const completeFollowUpSchema = z.object({
  outcome: z.enum(FOLLOW_UP_OUTCOMES),
  notes: z.string().nullable().optional(),
  next: scheduleFollowUpSchema.nullable(),
})

export type CompleteFollowUpInput = z.infer<typeof completeFollowUpSchema>

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
    .transform((value) => value.replace(/[,\s]/g, ""))
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
  .transform(narrowestCatalogPick)

export type LeadPreferenceFormInput = z.input<typeof leadPreferenceFormSchema>

/** Max budget as typed: digits with optional commas, empty = unknown. */
const budgetFormField = z
  .string()
  .trim()
  .transform((value) => value.replace(/[,\s]/g, ""))
  .refine(
    (value) => value === "" || (Number.isFinite(Number(value)) && Number(value) >= 0),
    "Enter a valid amount"
  )
  .refine(
    (value) => value === "" || !Number.isFinite(Number(value)) || Number(value) <= MAX_BUDGET,
    "Enter an amount up to ₹1,00,00,00,000"
  )
  .transform((value) => (value === "" ? null : Number(value)))

export const createLeadFormSchema = z.object({
  fullName: z.string().trim().min(1, "Full name is required"),
  phone: indianPhoneFormSchema,
  email: z
    .string()
    .trim()
    .pipe(z.union([z.literal(""), z.email("Enter a valid email address")]))
    .transform((value) => (value === "" ? null : value)),
  source: z.enum(SELECTABLE_LEAD_SOURCES, { error: "Select a source" }),
  vehicleId: optionalText,
  budget: budgetFormField,
  preferredVehicle: optionalText,
  purchaseTimeline: optionalText,
  currentVehicle: optionalText,
  financeRequired: yesNoUnknown,
  tradeInRequired: yesNoUnknown,
  notes: optionalText,
  ...preferenceFormFields,
})
  .transform(narrowestCatalogPick)

export type CreateLeadFormInput = z.input<typeof createLeadFormSchema>

/**
 * Edit form: the create form's contact and requirement fields. Any source is
 * accepted so a lead from the website or an older channel keeps its source.
 */
export const editLeadFormSchema = z.object({
  fullName: z.string().trim().min(1, "Full name is required"),
  phone: indianPhoneFormSchema,
  email: z
    .string()
    .trim()
    .pipe(z.union([z.literal(""), z.email("Enter a valid email address")]))
    .transform((value) => (value === "" ? null : value)),
  source: z.enum(LEAD_SOURCES, { error: "Select a source" }),
  budget: budgetFormField,
  purchaseTimeline: optionalText,
  currentVehicle: optionalText,
  financeRequired: yesNoUnknown,
  tradeInRequired: yesNoUnknown,
  notes: optionalText,
})

export type EditLeadFormInput = z.input<typeof editLeadFormSchema>

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

export const completeFollowUpFormSchema = z
  .object({
    outcome: z.enum(FOLLOW_UP_OUTCOMES, { error: "Select an outcome" }),
    notes: optionalText,
    scheduleNext: z.boolean(),
    next: z.object({
      scheduledAt: z.string(),
      taskType: z.enum(FOLLOW_UP_TASK_TYPES, { error: "Select a task type" }),
      notes: z.string(),
    }),
  })
  .superRefine((value, ctx) => {
    if (!value.scheduleNext) return
    const parsed = scheduleFollowUpFormSchema.safeParse(value.next)
    for (const issue of parsed.error?.issues ?? []) {
      ctx.addIssue({ code: "custom", message: issue.message, path: ["next", ...issue.path] })
    }
  })
  .transform(
    (value): CompleteFollowUpInput => ({
      outcome: value.outcome,
      notes: value.notes,
      next: value.scheduleNext ? scheduleFollowUpFormSchema.parse(value.next) : null,
    })
  )

export type CompleteFollowUpFormInput = z.input<typeof completeFollowUpFormSchema>
