import { z } from "zod"

const e164Regex = /^\+[1-9]\d{1,14}$/

export const createLeadSchema = z.object({
  showroomId: z.string().uuid(),
  fullName: z.string().min(1, "Full name is required"),
  phone: z.string().regex(e164Regex, "Enter a valid E.164 phone number (e.g. +919876543210)"),
  email: z.email().nullable().optional(),
  source: z.enum([
    "marketplace",
    "mobile_app",
    "website",
    "phone",
    "walkin",
    "whatsapp",
    "instagram",
    "facebook",
    "referral",
    "other",
  ]),
  vehicleId: z.string().uuid().nullable().optional(),
  budget: z.number().positive().nullable().optional(),
  preferredVehicle: z.string().nullable().optional(),
  purchaseTimeline: z.string().nullable().optional(),
  financeRequired: z.boolean().nullable().optional(),
  currentVehicle: z.string().nullable().optional(),
  tradeInRequired: z.boolean().nullable().optional(),
  notes: z.string().nullable().optional(),
})

export type CreateLeadInput = z.infer<typeof createLeadSchema>

export const changeLeadStatusSchema = z.object({
  status: z.string().min(1),
  notes: z.string().nullable().optional(),
})

export type ChangeLeadStatusInput = z.infer<typeof changeLeadStatusSchema>

export const scheduleFollowUpSchema = z.object({
  scheduledAt: z.string().datetime({ message: "Enter a valid date/time" }),
  taskType: z.enum([
    "call",
    "whatsapp",
    "meeting",
    "test_drive",
    "send_quotation",
    "other",
  ]),
  notes: z.string().nullable().optional(),
})

export type ScheduleFollowUpInput = z.infer<typeof scheduleFollowUpSchema>
