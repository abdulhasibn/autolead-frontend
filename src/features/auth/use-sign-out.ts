"use client"

import { useState } from "react"
import { signOut } from "next-auth/react"
import { toast } from "sonner"
import { revokeSessionAction } from "./actions"
import type { SignOutScope } from "./api"

/**
 * Signs out on the API first, then clears the next-auth session.
 *
 * - `local`: always ends up signed out here, even if the API call fails
 *   (the session then just expires on its own).
 * - `global`: stays signed in when the API call fails, so the user can retry
 *   instead of believing their other devices were signed out.
 */
export function useSignOut() {
  const [pending, setPending] = useState<SignOutScope | null>(null)

  async function signOutWith(scope: SignOutScope) {
    if (pending) return
    setPending(scope)
    const toastId = toast.loading(
      scope === "global" ? "Signing out of all devices…" : "Signing out…"
    )

    const result = await revokeSessionAction(scope)
    if (!result.ok && scope === "global") {
      toast.error("Couldn't sign out your other devices. Please try again.", {
        id: toastId,
      })
      setPending(null)
      return
    }

    await signOut({ redirectTo: "/login" })
  }

  return { pending, signOutWith }
}
