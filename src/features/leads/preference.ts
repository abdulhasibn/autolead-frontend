import type { LeadPreferenceFormInput } from "./schemas"
import type { LeadPreference, LeadReadModel } from "./types"

export const EMPTY_PREFERENCE_FORM: LeadPreferenceFormInput = {
  preferredMakeId: "",
  preferredModelId: "",
  preferredVariantId: "",
  preferredColours: [],
  preferredFuelTypes: [],
  preferredTransmissions: [],
  preferredBodyTypes: [],
  preferredYearMin: "",
  preferredYearMax: "",
  preferredKmMax: "",
  preferredMaxOwners: "",
}

function toText(value: number | string | null): string {
  return value == null ? "" : String(value)
}

/** Seeds the preference form from a stored preference. */
export function preferenceToFormValues(pref: LeadPreference): LeadPreferenceFormInput {
  return {
    preferredMakeId: toText(pref.preferredMakeId),
    preferredModelId: toText(pref.preferredModelId),
    preferredVariantId: toText(pref.preferredVariantId),
    preferredColours: [...pref.preferredColours],
    preferredFuelTypes: [...pref.preferredFuelTypes],
    preferredTransmissions: [...pref.preferredTransmissions],
    preferredBodyTypes: [...pref.preferredBodyTypes],
    preferredYearMin: toText(pref.preferredYearMin),
    preferredYearMax: toText(pref.preferredYearMax),
    preferredKmMax: toText(pref.preferredKmMax),
    preferredMaxOwners: toText(pref.preferredMaxOwners),
  }
}

/** True when any preference criterion is set (budget lives on the lead). */
export function hasPreference(pref: LeadPreference): boolean {
  return Boolean(
    pref.preferredMakeId ||
      pref.preferredModelId ||
      pref.preferredVariantId ||
      pref.preferredColours.length ||
      pref.preferredFuelTypes.length ||
      pref.preferredTransmissions.length ||
      pref.preferredBodyTypes.length ||
      pref.preferredYearMin != null ||
      pref.preferredYearMax != null ||
      pref.preferredKmMax != null ||
      pref.preferredMaxOwners != null
  )
}

export function capitalize(value: string): string {
  return value.replace(/\b\p{L}/gu, (c) => c.toUpperCase())
}

/** "Hyundai Creta 1.6 SX", or null when no catalog pick was made. */
export function formatPreferredCatalog(
  lead: Pick<LeadReadModel, "preferredMakeName" | "preferredModelName" | "preferredVariantName">
): string | null {
  const name = [lead.preferredMakeName, lead.preferredModelName, lead.preferredVariantName]
    .filter(Boolean)
    .join(" ")
  return name || null
}

/** "2018 – 2022", "2018 or newer", "2022 or older", or null for any year. */
export function formatYearWindow(min: number | null, max: number | null): string | null {
  if (min != null && max != null) return min === max ? String(min) : `${min} – ${max}`
  if (min != null) return `${min} or newer`
  if (max != null) return `${max} or older`
  return null
}

/** 0 → "First owner only", 1 → "Up to 1 previous owner". */
export function formatMaxOwners(max: number | null): string | null {
  if (max == null) return null
  if (max === 0) return "First owner only"
  return `Up to ${max} previous ${max === 1 ? "owner" : "owners"}`
}
