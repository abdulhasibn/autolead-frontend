import type {
  BodyType,
  FollowUpOutcome,
  FollowUpTaskType,
  LeadSource,
  LeadStatus,
  MatchCriterion,
  MatchOutcome,
} from "./types"

// Mirrors the backend's lead domain (lead-status / lead-source /
// follow-up-task-type / follow-up-outcome value objects). Keep in sync when those change.

export const LEAD_STATUSES = [
  "new",
  "not_now",
  "booking_confirmed",
  "converted",
  "lost",
  "vehicle_unavailable",
] as const

export const LEAD_SOURCES = [
  "marketplace",
  "mobile_app",
  "website",
  "phone",
  "walkin",
  "whatsapp",
  "instagram",
  "facebook",
  "referral",
  "other",
] as const

export const FOLLOW_UP_TASK_TYPES = [
  "call",
  "whatsapp",
  "meeting",
  "test_drive",
  "send_quotation",
  "other",
] as const

export const FOLLOW_UP_OUTCOMES = [
  "reached",
  "no_answer",
  "rescheduled",
  "not_interested",
  "done",
] as const

// Mirrors the backend's lead preference / match score (ADR-0013).

export const BODY_TYPES = [
  "hatchback",
  "sedan",
  "suv",
  "muv",
  "mpv",
  "crossover",
  "coupe",
  "convertible",
  "sports",
  "pick-up",
] as const

export const MATCH_CRITERIA = [
  "catalog",
  "budget",
  "year",
  "km",
  "fuelType",
  "transmission",
  "bodyType",
  "previousOwners",
  "colour",
] as const

export const BODY_TYPE_LABELS: Record<BodyType, string> = {
  hatchback: "Hatchback",
  sedan: "Sedan",
  suv: "SUV",
  muv: "MUV",
  mpv: "MPV",
  crossover: "Crossover",
  coupe: "Coupe",
  convertible: "Convertible",
  sports: "Sports",
  "pick-up": "Pick-up",
}

export const MATCH_CRITERION_LABELS: Record<MatchCriterion, string> = {
  catalog: "Make / model",
  budget: "Budget",
  year: "Year",
  km: "Km driven",
  fuelType: "Fuel",
  transmission: "Transmission",
  bodyType: "Body type",
  previousOwners: "Owners",
  colour: "Colour",
}

/** Offered as one-click colour tags; any free text is accepted too. */
export const COLOUR_SUGGESTIONS = ["white", "silver", "grey", "black", "red", "blue"] as const

export const PREFERRED_COLOURS_MAX = 20
export const PREFERRED_COLOUR_MAX_LENGTH = 40
export const PREFERRED_YEAR_MIN = 1950
export const PREFERRED_YEAR_MAX = 2100

/** Pill colours per match outcome; reuses the lead status palette. */
export const MATCH_OUTCOME_CLASSES: Record<MatchOutcome, string> = {
  match: "bg-success-muted text-success",
  partial: "bg-warning-muted text-warning",
  miss: "bg-destructive/10 text-destructive",
  unknown: "bg-muted text-muted-foreground",
}

/** Score bands: 80+ good, 60–79 fair, below 60 poor. */
export function matchScoreOutcome(score: number): Exclude<MatchOutcome, "unknown"> {
  if (score >= 80) return "match"
  if (score >= 60) return "partial"
  return "miss"
}

export const LEADS_PAGE_SIZE = 20

/** The backend caps `limit` at 100; search scans at most this many leads. */
export const LEADS_SEARCH_SCAN_LIMIT = 100

export const LEAD_STATUS_LABELS: Record<LeadStatus, string> = {
  new: "New",
  not_now: "Not now",
  booking_confirmed: "Booking confirmed",
  converted: "Converted",
  lost: "Lost",
  vehicle_unavailable: "Vehicle unavailable",
}

/** Pill colors for each status; matches the dashboard palette. */
export const LEAD_STATUS_BADGE_CLASSES: Record<LeadStatus, string> = {
  new: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  not_now: "bg-warning-muted text-warning",
  booking_confirmed: "bg-accent text-primary",
  converted: "bg-success-muted text-success",
  lost: "bg-destructive/10 text-destructive",
  vehicle_unavailable: "bg-muted text-muted-foreground",
}

export const LEAD_SOURCE_LABELS: Record<LeadSource, string> = {
  marketplace: "Marketplace",
  mobile_app: "Mobile app",
  website: "Website",
  phone: "Phone",
  walkin: "Walk-in",
  whatsapp: "WhatsApp",
  instagram: "Instagram",
  facebook: "Facebook",
  referral: "Referral",
  other: "Other",
}

export const FOLLOW_UP_TASK_TYPE_LABELS: Record<FollowUpTaskType, string> = {
  call: "Call",
  whatsapp: "WhatsApp",
  meeting: "Meeting",
  test_drive: "Test drive",
  send_quotation: "Send quotation",
  other: "Other",
}

export const FOLLOW_UP_OUTCOME_LABELS: Record<FollowUpOutcome, string> = {
  reached: "Reached",
  no_answer: "No answer",
  rescheduled: "Rescheduled",
  not_interested: "Not interested",
  done: "Done",
}

const ALLOWED_TRANSITIONS: Record<LeadStatus, readonly LeadStatus[]> = {
  new: ["not_now", "booking_confirmed", "lost", "vehicle_unavailable"],
  not_now: ["new", "booking_confirmed", "lost", "vehicle_unavailable"],
  booking_confirmed: ["converted", "lost", "vehicle_unavailable"],
  converted: [],
  lost: [],
  vehicle_unavailable: ["new", "not_now", "booking_confirmed", "lost"],
}

/** Set by the backend when another lead buys this lead's vehicle. */
const SYSTEM_MANAGED_STATUSES: readonly LeadStatus[] = ["vehicle_unavailable"]

/** Statuses the backend refuses unless a vehicle is linked to the lead. */
export const VEHICLE_REQUIRED_STATUSES: readonly LeadStatus[] = [
  "booking_confirmed",
  "converted",
]

export function isLeadStatus(value: unknown): value is LeadStatus {
  return (LEAD_STATUSES as readonly unknown[]).includes(value)
}

export function isLeadClosed(status: LeadStatus): boolean {
  return ALLOWED_TRANSITIONS[status].length === 0
}

/** Statuses a user may manually move a lead to from `current`. */
export function getNextLeadStatuses(current: LeadStatus): LeadStatus[] {
  return ALLOWED_TRANSITIONS[current].filter(
    (status) => !SYSTEM_MANAGED_STATUSES.includes(status)
  )
}
