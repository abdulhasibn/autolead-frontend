import { z } from "zod"

const e164Regex = /^\+[1-9]\d{1,14}$/

export const createOwnerSchema = z.object({
  fullName: z.string().min(1, "Full name is required"),
  phone: z.string().regex(e164Regex, "Enter a valid E.164 phone number"),
  email: z.email().nullable().optional(),
  address: z.string().nullable().optional(),
  city: z.string().nullable().optional(),
  preferredContactMethod: z
    .enum(["phone", "email", "whatsapp"])
    .nullable()
    .optional(),
  altPhone: z
    .string()
    .regex(e164Regex, "Enter a valid E.164 phone number")
    .nullable()
    .optional(),
  idInfo: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
})

export type CreateOwnerInput = z.infer<typeof createOwnerSchema>
export type UpdateOwnerInput = CreateOwnerInput
