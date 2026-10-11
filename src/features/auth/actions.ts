"use server"

import { z } from "zod"
import { auth } from "@/lib/auth"
import { actionError, actionOk, validationError, type ActionResult } from "@/lib/action-result"
import { logout } from "./api"

const scopeSchema = z.enum(["local", "global"])

/**
 * Revokes the signed-in user's backend session(s) before the client clears
 * its own cookie. Clearing the cookie alone would leave the refresh token
 * valid on the API. The token never leaves the server.
 */
export async function revokeSessionAction(scope: unknown): Promise<ActionResult> {
  const parsed = scopeSchema.safeParse(scope)
  if (!parsed.success) return validationError()

  const session = await auth()
  // Nothing to revoke: no session, or the API already refused its refresh token.
  if (!session?.accessToken || session.error === "RefreshTokenError") return actionOk(undefined)

  try {
    await logout(parsed.data)
    return actionOk(undefined)
  } catch (err) {
    return actionError(err)
  }
}
