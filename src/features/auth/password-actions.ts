"use server"

import { auth } from "@/lib/auth"
import { ApiError } from "@/lib/api-error"
import { actionError, actionOk, validationError, type ActionResult } from "@/lib/action-result"
import { changePassword, forgotPassword, resetPassword } from "./api"
import { changePasswordSchema, forgotPasswordSchema, resetPasswordSchema } from "./schemas"

/** Step 1 of a reset. The API answers the same whether or not the account exists. */
export async function requestPasswordResetAction(input: unknown): Promise<ActionResult> {
  try {
    const parsed = forgotPasswordSchema.safeParse(input)
    if (!parsed.success) return validationError(parsed.error.issues[0]?.message)
    await forgotPassword(parsed.data.email)
    return actionOk(undefined)
  } catch (err) {
    return actionError(err)
  }
}

/** Step 2 of a reset: code + new password. Every session ends; sign in again. */
export async function resetPasswordAction(input: unknown): Promise<ActionResult> {
  try {
    const parsed = resetPasswordSchema.safeParse(input)
    if (!parsed.success) return validationError(parsed.error.issues[0]?.message)
    const { email, code, newPassword } = parsed.data
    await resetPassword({ email, code, newPassword })
    return actionOk(undefined)
  } catch (err) {
    return actionError(err)
  }
}

/** Signed-in change. Other devices are signed out; this session stays. */
export async function changePasswordAction(input: unknown): Promise<ActionResult> {
  try {
    const session = await auth()
    if (!session?.user) throw new ApiError(401, "AUTHENTICATION_FAILED", "Not signed in")
    const parsed = changePasswordSchema.safeParse(input)
    if (!parsed.success) return validationError(parsed.error.issues[0]?.message)
    const { currentPassword, newPassword } = parsed.data
    await changePassword({ currentPassword, newPassword })
    return actionOk(undefined)
  } catch (err) {
    return actionError(err)
  }
}
