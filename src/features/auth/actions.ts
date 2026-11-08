"use server"

import { z } from "zod"
import { auth } from "@/lib/auth"
import { actionError, actionOk, validationError, type ActionResult } from "@/lib/action-result"
import { logout } from "./api"
import { lockVault } from "@/features/finance/api"
import { clearFinanceSession } from "@/features/finance/session"

const scopeSchema = z.enum(["local", "global"])

/**
 * Revokes the signed-in user's backend session(s) before the client clears
 * its own cookie. Clearing the cookie alone would leave the refresh token
 * valid on the API. The token never leaves the server.
 */
export async function revokeSessionAction(scope: unknown): Promise<ActionResult> {
  const parsed = scopeSchema.safeParse(scope)
  if (!parsed.success) return validationError()

  // Finance first: end the unlocked session on the API, then drop its cookie.
  // Best effort — signing out must never be blocked by finance.
  try {
    await lockVault()
  } catch {
    // The session expires on its own.
  }
  await clearFinanceSession().catch(() => undefined)

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
