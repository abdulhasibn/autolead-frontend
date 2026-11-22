import type { UseFormSetError } from "react-hook-form"
import type { ActionError } from "@/lib/action-result"
import type { CreateOwnerInput } from "./schemas"

export const OWNER_PHONE_TAKEN = "An owner with this phone number already exists."

/**
 * An owner has one unique field, the phone, so a 409 from saving one means
 * that phone is taken. Puts the message on the field. Returns false for any
 * other error so the caller can show its usual toast.
 */
export function showOwnerPhoneConflict(
  error: ActionError,
  setError: UseFormSetError<CreateOwnerInput>
): boolean {
  if (error.status !== 409) return false
  setError("phone", { type: "server", message: OWNER_PHONE_TAKEN }, { shouldFocus: true })
  return true
}
