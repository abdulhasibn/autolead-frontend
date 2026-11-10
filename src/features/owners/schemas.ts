import { z } from "zod"
import { indianPhoneFormSchema, optionalIndianPhoneFormSchema } from "@/lib/phone"

export const createOwnerSchema = z.object({
  fullName: z.string().min(1, "Full name is required"),
  phone: indianPhoneFormSchema,
  email: z.email().nullable().optional(),
  address: z.string().nullable().optional(),
  city: z.string().nullable().optional(),
  preferredContactMethod: z
    .enum(["phone", "email", "whatsapp"])
    .nullable()
    .optional(),
  altPhone: optionalIndianPhoneFormSchema.optional(),
  idInfo: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
})

export type CreateOwnerInput = z.infer<typeof createOwnerSchema>
export type UpdateOwnerInput = CreateOwnerInput
