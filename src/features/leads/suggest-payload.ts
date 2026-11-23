import { hasPreference } from "./preference"
import {
  leadPreferenceFormSchema,
  type CreateLeadFormInput,
  type SuggestVehiclesInput,
} from "./schemas"

/**
 * The new-lead wizard lists cars from this score up. The lead page keeps the
 * API default (60); the wizard also shows partial matches, each with its true
 * server-side percentage.
 */
export const WIZARD_SUGGESTION_MIN_SCORE = 40

export type SuggestDraft =
  | { kind: "invalid" }
  | { kind: "empty" }
  | { kind: "ready"; payload: SuggestVehiclesInput; key: string }

/**
 * Turns the form's raw inputs into the suggestions payload. The budget field
 * shows Indian grouping ("9,00,000"), so commas and spaces are dropped before
 * parsing, as the form schema does when the lead is saved.
 */
export function buildSuggestPayload(values: Partial<CreateLeadFormInput>): SuggestDraft {
  const pref = leadPreferenceFormSchema.safeParse({
    preferredMakeId: values.preferredMakeId ?? "",
    preferredModelId: values.preferredModelId ?? "",
    preferredVariantId: values.preferredVariantId ?? "",
    preferredColours: values.preferredColours ?? [],
    preferredFuelTypes: values.preferredFuelTypes ?? [],
    preferredTransmissions: values.preferredTransmissions ?? [],
    preferredBodyTypes: values.preferredBodyTypes ?? [],
    preferredYearMin: values.preferredYearMin ?? "",
    preferredKmMax: values.preferredKmMax ?? "",
    preferredMaxOwners: values.preferredMaxOwners ?? "",
  })
  const rawBudget = (values.budget ?? "").replace(/[,\s]/g, "")
  const budget = rawBudget === "" ? null : Number(rawBudget)
  if (!pref.success || (budget != null && !(Number.isFinite(budget) && budget >= 0))) {
    return { kind: "invalid" }
  }
  const preferredColours = pref.data.preferredColours
    .map((c) => c.trim().toLowerCase())
    .filter(Boolean)
  const payload: SuggestVehiclesInput = { ...pref.data, preferredColours, budget }
  if (budget == null && !hasPreference(payload)) return { kind: "empty" }
  return { kind: "ready", payload, key: JSON.stringify(payload) }
}
