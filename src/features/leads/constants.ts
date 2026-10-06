import type { LeadSource, LeadStatus, FollowUpTaskType } from "./types"

// Mirrors the backend's lead domain (lead-status / lead-source /
// follow-up-task-type value objects). Keep in sync when those change.

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

export const LEAD_STATUS_BADGE_VARIANTS: Record<
  LeadStatus,
  "default" | "secondary" | "destructive" | "outline"
> = {
  new: "default",
  not_now: "secondary",
  booking_confirmed: "outline",
  converted: "default",
  lost: "destructive",
  vehicle_unavailable: "secondary",
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
