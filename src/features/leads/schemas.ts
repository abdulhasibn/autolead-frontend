import { z } from "zod"
import { FOLLOW_UP_TASK_TYPES, LEAD_SOURCES, LEAD_STATUSES } from "./constants"

// Matches the backend Phone value object: "+" then 7–15 digits.
const e164Regex = /^\+[1-9]\d{6,14}$/
const phoneMessage = "Enter a valid E.164 phone number (e.g. +919876543210)"

// ---------------------------------------------------------------------------
// API payloads — validated again inside Server Actions before hitting the API
// ---------------------------------------------------------------------------

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
})

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
})

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
