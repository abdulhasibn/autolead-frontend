import { z } from "zod"

const e164Regex = /^\+[1-9]\d{1,14}$/

export const createUserSchema = z.object({
  fullName: z.string().min(1, "Full name is required"),
  phone: z.string().regex(e164Regex, "Enter a valid E.164 phone number"),
  email: z.email("Enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  showroomId: z.string().uuid().nullable().optional(),
  roles: z
    .array(z.enum(["admin", "salesperson"]))
    .min(1, "At least one role is required"),
})

export type CreateUserInput = z.infer<typeof createUserSchema>
