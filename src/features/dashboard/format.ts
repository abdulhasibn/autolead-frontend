import type { DashboardPeriodKey } from "./types"

export const PERIOD_LABELS: Record<DashboardPeriodKey, string> = {
  today: "Today",
  week: "This week",
  month: "This month",
  quarter: "This quarter",
}

export const TASK_TYPE_LABELS: Record<string, string> = {
  call: "Call",
  whatsapp: "WhatsApp",
  meeting: "Meeting",
  test_drive: "Test drive",
  send_quotation: "Send quotation",
  other: "Follow-up",
}

export const LEAD_STATUS_LABELS: Record<string, string> = {
  new: "New",
  not_now: "Not now",
  booking_confirmed: "Booking confirmed",
  converted: "Converted",
  lost: "Lost",
  vehicle_unavailable: "Vehicle unavailable",
}

export const SOURCE_LABELS: Record<string, string> = {
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

/** Returns a formatted percentage string like "18%" or "—" for null */
export function formatPercent(value: number | null): string {
  if (value === null) return "—"
  return `${Math.round(value * 100)}%`
}

/** Returns the delta between value and previous as an object with direction and display */
export function trendDelta(
  value: number | null,
  previous: number | null
): { direction: "up" | "down" | "neutral"; label: string } {
  if (value === null || previous === null) {
    return { direction: "neutral", label: "—" }
  }
  const diff = value - previous
  if (diff === 0) return { direction: "neutral", label: "—" }
  const abs = Math.abs(diff)
  // For percentage values (0–1 range), show pp difference
  const isRate = value >= 0 && value <= 1 && previous >= 0 && previous <= 1
  const label = isRate
    ? `${diff > 0 ? "+" : ""}${Math.round(diff * 100)}pp`
    : `${diff > 0 ? "+" : ""}${abs}`
  return {
    direction: diff > 0 ? "up" : "down",
    label,
  }
}

/** Formats a date/time string to "10:30 AM" (local time display) */
export function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  })
}

/** Relative time: "2d ago", "3h ago", "just now" */
export function relativeTime(iso: string): string {
  const now = Date.now()
  const then = new Date(iso).getTime()
  const diffMs = now - then
  const diffMin = Math.floor(diffMs / 60_000)
  if (diffMin < 1) return "just now"
  if (diffMin < 60) return `${diffMin}m ago`
  const diffH = Math.floor(diffMin / 60)
  if (diffH < 24) return `${diffH}h ago`
  const diffD = Math.floor(diffH / 24)
  return `${diffD}d ago`
}

/** Format a date range: "Oct 1 – Oct 31" */
export function formatDateRange(from: string, to: string): string {
  const f = new Date(from)
  const t = new Date(to)
  const opts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" }
  return `${f.toLocaleDateString("en-IN", opts)} – ${t.toLocaleDateString("en-IN", opts)}`
}

/** Return greeting based on current hour */
export function greeting(): string {
  const h = new Date().getHours()
  if (h < 12) return "Good morning"
  if (h < 17) return "Good afternoon"
  return "Good evening"
}
