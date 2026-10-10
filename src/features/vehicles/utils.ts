import {
  AGING_DAYS,
  MEDIA_CATEGORIES,
  MEDIA_CATEGORY_LABELS,
  RC_STATUS_LABELS,
  SERVICE_HISTORY_LABELS,
} from "./constants"
import type { VehicleDto, VehicleMediaDto } from "./types"

const DAY_MS = 24 * 60 * 60 * 1000
/** Insurance expiring within this window is flagged before it lapses. */
const INSURANCE_WARNING_DAYS = 30

/** Only open or linked vehicles can be linked to a lead. */
export function isVehicleLinkable(vehicle: Pick<VehicleDto, "status">): boolean {
  return vehicle.status === "open" || vehicle.status === "linked"
}

export function formatVehicleLabel(
  vehicle: Pick<
    VehicleDto,
    "year" | "makeName" | "modelName" | "variantName" | "registrationNumber"
  >
): string {
  const name = [vehicle.year, vehicle.makeName, vehicle.modelName, vehicle.variantName]
    .filter(Boolean)
    .join(" ")
  return `${name} · ${formatPlate(vehicle.registrationNumber)}`
}

/** "2021 Hyundai Creta" — the variant is shown separately as a subtitle. */
export function formatVehicleTitle(
  vehicle: Pick<VehicleDto, "year" | "makeName" | "modelName">
): string {
  return [vehicle.year, vehicle.makeName, vehicle.modelName].filter(Boolean).join(" ")
}

/**
 * Spaces an Indian plate into its groups ("KL07CU4521" → "KL 07 CU 4521").
 * Anything that doesn't fit the pattern (BH series, old plates) is left as is.
 */
export function formatPlate(registration: string): string {
  const match = /^([A-Z]{2})(\d{1,2})([A-Z]{0,3})(\d{1,4})$/.exec(registration)
  if (!match) return registration
  return match.slice(1).filter(Boolean).join(" ")
}

export function formatKm(km: number): string {
  return km.toLocaleString("en-IN")
}

/** 1 → "1st owner"; 0 means the car has had no previous owner. */
export function formatOwners(count: number): string {
  if (count === 0) return "No prior owner"
  const mod100 = count % 100
  const suffix =
    mod100 >= 11 && mod100 <= 13
      ? "th"
      : ({ 1: "st", 2: "nd", 3: "rd" } as Record<number, string>)[count % 10] ?? "th"
  return `${count}${suffix} owner`
}

export function daysSince(iso: string, now: Date = new Date()): number {
  return Math.max(0, Math.floor((now.getTime() - new Date(iso).getTime()) / DAY_MS))
}

/** Days in stock; sold and dropped vehicles no longer age. */
export function stockAge(
  vehicle: Pick<VehicleDto, "createdAt" | "status">,
  now?: Date
): { days: number; aging: boolean } | null {
  if (vehicle.status === "sold" || vehicle.status === "dropped") return null
  const days = daysSince(vehicle.createdAt, now)
  return { days, aging: days >= AGING_DAYS }
}

export type HealthTone = "good" | "warn" | "bad" | "unknown"

export interface HealthItem {
  key: "insurance" | "rc" | "service" | "accident"
  label: string
  value: string
  tone: HealthTone
}

/** Turns the paperwork and condition fields into a traffic-light checklist. */
export function paperworkHealth(
  vehicle: Pick<
    VehicleDto,
    "insuranceValidUntil" | "rcStatus" | "serviceHistory" | "accidentHistory"
  >,
  now: Date = new Date()
): HealthItem[] {
  return [
    insuranceHealth(vehicle.insuranceValidUntil, now),
    {
      key: "rc",
      label: "RC",
      value: vehicle.rcStatus ? RC_STATUS_LABELS[vehicle.rcStatus] : "Not recorded",
      tone: !vehicle.rcStatus ? "unknown" : vehicle.rcStatus === "clear" ? "good" : "warn",
    },
    {
      key: "service",
      label: "Service history",
      value: vehicle.serviceHistory
        ? SERVICE_HISTORY_LABELS[vehicle.serviceHistory]
        : "Not recorded",
      tone:
        vehicle.serviceHistory === "full"
          ? "good"
          : vehicle.serviceHistory === "partial" || vehicle.serviceHistory === "none"
            ? "warn"
            : "unknown",
    },
    {
      key: "accident",
      label: "Accident history",
      value: vehicle.accidentHistory ? "Reported" : "None",
      tone: vehicle.accidentHistory ? "warn" : "good",
    },
  ]
}

function insuranceHealth(validUntil: string | null, now: Date): HealthItem {
  const base = { key: "insurance", label: "Insurance" } as const
  if (!validUntil) return { ...base, value: "Not recorded", tone: "unknown" }
  // Calendar date (YYYY-MM-DD); compare at local midnight.
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(validUntil)
  if (!match) return { ...base, value: validUntil, tone: "unknown" }
  const end = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]))
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const days = Math.round((end.getTime() - today.getTime()) / DAY_MS)
  if (days < 0) return { ...base, value: "Expired", tone: "bad" }
  if (days === 0) return { ...base, value: "Expires today", tone: "bad" }
  if (days <= INSURANCE_WARNING_DAYS) {
    return { ...base, value: `Expires in ${days} ${days === 1 ? "day" : "days"}`, tone: "warn" }
  }
  return {
    ...base,
    value: `Valid till ${end.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}`,
    tone: "good",
  }
}

/** Earliest of several signed-URL expiry timestamps, ignoring nulls. */
export function earliestExpiry(values: Array<string | null | undefined>): string | null {
  let min: string | null = null
  for (const value of values) {
    if (value && (min === null || value < min)) min = value
  }
  return min
}

const ANGLE_ORDER: Record<string, number> = Object.fromEntries(
  MEDIA_CATEGORIES.map((category, i) => [category, i])
)

/**
 * Viewing order: the cover (lowest-sorted front shot) first, then the standard
 * angles in walk-around order, then extra shots — each by upload order.
 */
export function orderPhotos<T extends Pick<VehicleMediaDto, "category" | "sortOrder" | "uploadedAt">>(
  media: readonly T[]
): T[] {
  const rank = (m: T) => ANGLE_ORDER[m.category ?? "other"] ?? MEDIA_CATEGORIES.length
  return [...media].sort(
    (a, b) =>
      rank(a) - rank(b) ||
      a.sortOrder - b.sortOrder ||
      a.uploadedAt.localeCompare(b.uploadedAt)
  )
}

export function photoCaption(
  category: VehicleMediaDto["category"],
  isCover = false
): string {
  const label = MEDIA_CATEGORY_LABELS[category ?? "other"]
  return isCover ? `${label} · Cover` : label
}
