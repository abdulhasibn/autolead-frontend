import { z } from "zod"

export const loginSchema = z.object({
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
})

export type LoginInput = z.infer<typeof loginSchema>

const newPasswordSchema = z.string().min(8, "Use at least 8 characters")

export const forgotPasswordSchema = z.object({
  email: z.string().trim().pipe(z.email("Enter a valid email address")),
})

export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>

export const resetPasswordSchema = z
  .object({
    email: z.string().trim().pipe(z.email("Enter a valid email address")),
    code: z.string().trim().regex(/^\d{6}$/, "Enter the 6-digit code from the email"),
    newPassword: newPasswordSchema,
    confirmPassword: z.string(),
  })
  .refine((v) => v.newPassword === v.confirmPassword, {
    path: ["confirmPassword"],
    message: "The passwords don’t match",
  })

export type ResetPasswordFormInput = z.input<typeof resetPasswordSchema>

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Enter your current password"),
    newPassword: newPasswordSchema,
    confirmPassword: z.string(),
  })
  .refine((v) => v.newPassword === v.confirmPassword, {
    path: ["confirmPassword"],
    message: "The passwords don’t match",
  })
  .refine((v) => v.newPassword !== v.currentPassword, {
    path: ["newPassword"],
    message: "Pick a password different from the current one",
  })

export type ChangePasswordFormInput = z.input<typeof changePasswordSchema>
