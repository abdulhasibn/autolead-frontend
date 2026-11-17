"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import { auth } from "@/lib/auth"
import { ApiError } from "@/lib/api-error"
import { actionError, actionOk, validationError, type ActionResult } from "@/lib/action-result"
import { createUser, deleteUser, getUser, updateUser, updateUserRoles } from "./api"
import { createUserSchema, editUserSchema } from "./schemas"

const userIdSchema = z.guid()

/** Staff management is admin-only; the API enforces it too. */
async function requireAdmin() {
  const session = await auth()
  if (!session?.user) throw new ApiError(401, "AUTHENTICATION_FAILED", "Not signed in")
  if (!session.user.roles?.includes("admin")) {
    throw new ApiError(403, "FORBIDDEN", "Only an admin can manage staff")
  }
  return session
}

function revalidateStaff() {
  revalidatePath("/users")
}

export async function createUserAction(input: unknown): Promise<ActionResult> {
  try {
    await requireAdmin()
    const parsed = createUserSchema.safeParse(input)
    if (!parsed.success) return validationError(parsed.error.issues[0]?.message)
    await createUser(parsed.data)
    revalidateStaff()
    return actionOk(undefined)
  } catch (err) {
    return actionError(err)
  }
}

/**
 * Saves details, then roles when they changed (two endpoints). If the roles
 * call fails the details are already saved; the error says so.
 */
export async function updateUserAction(userId: string, input: unknown): Promise<ActionResult> {
  try {
    await requireAdmin()
    const id = userIdSchema.safeParse(userId)
    const parsed = editUserSchema.safeParse(input)
    if (!id.success || !parsed.success) return validationError(parsed.error?.issues[0]?.message)

    const { roles, ...details } = parsed.data
    const current = await getUser(id.data)
    await updateUser(id.data, details)
    revalidateStaff()

    const sameRoles =
      roles.length === current.roles.length && roles.every((r) => current.roles.includes(r))
    if (!sameRoles) {
      try {
        await updateUserRoles(id.data, roles)
      } catch (err) {
        const { error } = actionError(err)
        return {
          ok: false,
          error: { ...error, message: `Details saved, but the roles weren’t changed: ${error.message}` },
        }
      }
    }
    return actionOk(undefined)
  } catch (err) {
    return actionError(err)
  }
}

/** Soft-deactivates: sign-in stops and every session ends. Their leads stay assigned. */
export async function deactivateUserAction(userId: string): Promise<ActionResult> {
  try {
    const session = await requireAdmin()
    const id = userIdSchema.safeParse(userId)
    if (!id.success) return validationError()
    if (session.user.id === id.data) {
      throw new ApiError(409, "LAST_ADMIN_PROTECTED", "You can’t deactivate your own account")
    }
    await deleteUser(id.data)
    revalidateStaff()
    return actionOk(undefined)
  } catch (err) {
    return actionError(err)
  }
}
