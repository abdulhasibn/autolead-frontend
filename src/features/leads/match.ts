import { FUEL_TYPE_LABELS, TRANSMISSION_LABELS } from "@/features/vehicles/constants"
import { formatKm } from "@/features/vehicles/utils"
import { formatCurrency } from "@/lib/format"
import { BODY_TYPE_LABELS, MATCH_CRITERION_LABELS } from "./constants"
import { capitalize, formatPreferredCatalog, formatYearWindow } from "./preference"
import type { LeadReadModel, MatchableVehicle, MatchBreakdownEntry } from "./types"

export interface MatchChip {
  /** Short pill text, e.g. "Km a bit over". */
  label: string
  /** "Wanted vs has" text for a tooltip, when both sides are known. */
  detail: string | null
}

function list<T extends string>(values: readonly T[], labels?: Record<T, string>): string {
  return values.map((v) => labels?.[v] ?? capitalize(v)).join(" / ")
}

function wantedVsHas(
  entry: MatchBreakdownEntry,
  lead: LeadReadModel,
  vehicle: MatchableVehicle
): string | null {
  switch (entry.criterion) {
    case "catalog": {
      const wanted = formatPreferredCatalog(lead)
      const has = [vehicle.makeName, vehicle.modelName, vehicle.variantName].filter(Boolean).join(" ")
      return wanted ? `Wants ${wanted} · car is ${has}` : null
    }
    case "budget":
      return lead.budget == null
        ? null
        : `Budget ${formatCurrency(lead.budget)} · ${
            vehicle.listedPrice == null ? "car not priced yet" : `car ${formatCurrency(vehicle.listedPrice)}`
          }`
    case "year": {
      const wanted = formatYearWindow(lead.preferredYearMin, lead.preferredYearMax)
      return wanted ? `Wants ${wanted} · car is ${vehicle.year}` : null
    }
    case "km":
      return lead.preferredKmMax == null
        ? null
        : `Wants ≤ ${formatKm(lead.preferredKmMax)} km · car has ${formatKm(vehicle.kmDriven)} km`
    case "fuelType":
      return `Wants ${list(lead.preferredFuelTypes, FUEL_TYPE_LABELS)} · car is ${FUEL_TYPE_LABELS[vehicle.fuelType] ?? vehicle.fuelType}`
    case "transmission":
      return `Wants ${list(lead.preferredTransmissions, TRANSMISSION_LABELS)} · car is ${TRANSMISSION_LABELS[vehicle.transmission] ?? vehicle.transmission}`
    case "bodyType":
      return vehicle.bodyTypes.length
        ? `Wants ${list(lead.preferredBodyTypes, BODY_TYPE_LABELS)} · car is ${list(vehicle.bodyTypes, BODY_TYPE_LABELS)}`
        : `Wants ${list(lead.preferredBodyTypes, BODY_TYPE_LABELS)} · body type not in catalog`
    case "previousOwners":
      return lead.preferredMaxOwners == null
        ? null
        : `Wants ≤ ${lead.preferredMaxOwners} previous owners · car has ${vehicle.numPreviousOwners}`
    case "colour":
      return `Wants ${list(lead.preferredColours)} · car is ${vehicle.colour}`
    default:
      return null
  }
}

function chipLabel(entry: MatchBreakdownEntry, lead: LeadReadModel): string {
  const base = MATCH_CRITERION_LABELS[entry.criterion] ?? entry.criterion
  const { criterion, outcome } = entry

  if (outcome === "unknown") {
    if (criterion === "budget") return "Budget: car not priced"
    if (criterion === "bodyType") return "Body type: not in catalog"
    return `${base}: unknown`
  }

  if (criterion === "catalog") {
    if (outcome === "match") {
      if (lead.preferredVariantId) return "Exact variant"
      if (lead.preferredModelId) return "Model"
      return "Make"
    }
    if (outcome === "partial") {
      // Wanted a variant: same model earns 20 of 30, same make 8.
      return lead.preferredVariantId && entry.earned >= 20 ? "Model ✓, other variant" : "Same make"
    }
    return "Other make / model"
  }

  if (outcome === "partial") {
    switch (criterion) {
      case "budget":
        return "A bit over budget"
      case "year":
        return "Year a bit off"
      case "km":
        return "Km a bit over"
      case "previousOwners":
        return "One owner over"
    }
  }

  if (outcome === "miss") {
    switch (criterion) {
      case "budget":
        return "Over budget"
      case "year":
        return "Year out of range"
      case "km":
        return "Km too high"
      case "previousOwners":
        return "Too many owners"
    }
  }

  return base
}

export function matchChip(
  entry: MatchBreakdownEntry,
  lead: LeadReadModel,
  vehicle: MatchableVehicle
): MatchChip {
  return { label: chipLabel(entry, lead), detail: wantedVsHas(entry, lead, vehicle) }
}
