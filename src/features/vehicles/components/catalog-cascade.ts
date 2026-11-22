import type { UseFormSetValue } from "react-hook-form"
import type { VehicleFormInput } from "../schemas"

/**
 * Choosing another make or model drops the variant, and with it the fuel and
 * transmission that were filled in from it (or typed on top of it): they
 * belong to the old variant. Picking the new variant fills them again.
 */
export function clearVariantAndDependents(setValue: UseFormSetValue<VehicleFormInput>) {
  setValue("variantId", "")
  setValue("fuelType", "" as VehicleFormInput["fuelType"])
  setValue("transmission", "" as VehicleFormInput["transmission"])
}
