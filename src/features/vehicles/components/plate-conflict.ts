import type { UseFormSetError } from "react-hook-form"
import type { ActionError } from "@/lib/action-result"
import type { VehicleFormInput } from "../schemas"

export const PLATE_TAKEN = "A vehicle with this registration number already exists."

/**
 * A vehicle has one unique field, the registration number, so a 409 from
 * saving one means that plate is taken. Goes back to the step that has the
 * plate (the first), puts the message on the field and returns true. Returns
 * false for any other error so the caller can show its usual toast.
 */
export function showPlateConflict(
  error: ActionError,
  setError: UseFormSetError<VehicleFormInput>,
  goToPlateStep: () => void
): boolean {
  if (error.status !== 409) return false
  goToPlateStep()
  setError("registrationNumber", { type: "server", message: PLATE_TAKEN }, { shouldFocus: true })
  return true
}
