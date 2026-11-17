import { z } from "zod"
import { indianPhoneFormSchema } from "@/lib/phone"

export const STAFF_ROLES = ["admin", "salesperson"] as const

const rolesSchema = z.array(z.enum(STAFF_ROLES)).min(1, "Pick at least one role")

/** "" from the showroom picker means no home showroom. */
const showroomIdSchema = z
  .union([z.literal(""), z.guid(), z.null()])
  .transform((value) => (value ? value : null))

const detailFields = {
  fullName: z.string().trim().min(1, "Full name is required"),
  phone: indianPhoneFormSchema,
  email: z.string().trim().pipe(z.email("Enter a valid email address")),
  showroomId: showroomIdSchema,
}

export const createUserSchema = z.object({
  ...detailFields,
  password: z.string().min(8, "Password must be at least 8 characters"),
  roles: rolesSchema,
})

export type CreateUserFormInput = z.input<typeof createUserSchema>
export type CreateUserInput = z.infer<typeof createUserSchema>

/** PATCH /users/:id replaces these four fields. */
export const updateUserSchema = z.object(detailFields)

export type UpdateUserInput = z.infer<typeof updateUserSchema>

/** The edit form: details plus roles, saved through two endpoints. */
export const editUserSchema = z.object({ ...detailFields, roles: rolesSchema })

export type EditUserFormInput = z.input<typeof editUserSchema>
export type EditUserInput = z.infer<typeof editUserSchema>
