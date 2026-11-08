import type { BudgetBand, Channel, LeadIntent, LeadJourney, Signal } from "./types"

export type InsightsTab = "traffic" | "cars" | "demand"

export const INSIGHTS_TABS: InsightsTab[] = ["traffic", "cars", "demand"]

export const INSIGHTS_TAB_LABELS: Record<InsightsTab, string> = {
  traffic: "Traffic",
  cars: "Cars",
  demand: "Demand",
}

export function isInsightsTab(v: unknown): v is InsightsTab {
  return typeof v === "string" && INSIGHTS_TABS.includes(v as InsightsTab)
}

export const CHANNEL_LABELS: Record<Channel, string> = {
  instagram_ads: "Instagram ads",
  instagram_organic: "Instagram organic",
  facebook_ads: "Facebook ads",
  facebook_organic: "Facebook organic",
  google_ads: "Google ads",
  google_organic: "Google search",
  whatsapp: "WhatsApp",
  direct: "Direct",
  referral: "Referral",
  other: "Other",
}

export function channelLabel(channel: Channel | null): string {
  return channel ? (CHANNEL_LABELS[channel] ?? channel) : "—"
}

export function isInstagramChannel(channel: Channel | null): boolean {
  return channel === "instagram_ads" || channel === "instagram_organic"
}

/** Signal pills use the lead-status palette: green = good, amber = act, red = problem. */
export const SIGNAL_PILLS: Record<Signal, { label: string; className: string }> = {
  hot: { label: "Hot", className: "bg-success-muted text-success" },
  seen_not_enquired: { label: "Seen, not enquired", className: "bg-warning-muted text-warning" },
  low_visibility: {
    label: "Low visibility",
    className: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  },
  ageing_cooling: { label: "Ageing, cooling", className: "bg-destructive/10 text-destructive" },
  insufficient_data: { label: "Not enough data", className: "bg-muted text-muted-foreground" },
  normal: { label: "Normal", className: "bg-accent text-primary" },
}

export function signalPill(code: Signal): { label: string; className: string } {
  return SIGNAL_PILLS[code] ?? { label: code, className: SIGNAL_PILLS.insufficient_data.className }
}

export const INTENT_PILLS: Record<LeadIntent, { label: string; className: string }> = {
  high: { label: "High intent", className: "bg-success-muted text-success" },
  medium: { label: "Medium intent", className: "bg-warning-muted text-warning" },
  low: { label: "Low intent", className: "bg-muted text-muted-foreground" },
}

export const BUDGET_BAND_LABELS: Record<BudgetBand, string> = {
  "<4L": "Under ₹4L",
  "4-6L": "₹4–6L",
  "6-8L": "₹6–8L",
  "8-12L": "₹8–12L",
  "12L+": "₹12L+",
}

const countFormatter = new Intl.NumberFormat("en-IN")

/** "3,412" in Indian grouping; "—" for null. */
export function formatCount(value: number | null | undefined): string {
  return value == null ? "—" : countFormatter.format(value)
}

/** A 0–1 rate as a percent with one decimal below 10%: 0.0217 → "2.2%", 0.31 → "31%". */
export function formatRate(value: number | null | undefined): string {
  if (value == null) return "—"
  const pct = value * 100
  if (pct === 0) return "0%"
  return pct < 10 ? `${pct.toFixed(1)}%` : `${Math.round(pct)}%`
}

/** A 0–100 share: 31 → "31%". */
export function formatShare(value: number | null | undefined): string {
  return value == null ? "—" : `${Math.round(value)}%`
}

/** Part of a whole as a 0–100 share, or null when the whole is zero. */
export function shareOf(part: number, whole: number): number | null {
  return whole > 0 ? (part / whole) * 100 : null
}

/** Rupees in lakh: 940000 → "₹9.4L", 1240000 → "₹12.4L", 85000 → "₹0.85L". */
export function formatLakh(value: number | null | undefined): string {
  if (value == null) return "—"
  const lakh = value / 100_000
  const digits = lakh < 1 ? 2 : 1
  return `₹${Number(lakh.toFixed(digits))}L`
}

/** Signed percentage change between two per-day rates: 9 → 14.5 gives "+61%". */
export function formatChange(before: number, after: number): string {
  if (before === 0) return after === 0 ? "0%" : "new"
  const pct = Math.round(((after - before) / before) * 100)
  return `${pct > 0 ? "+" : ""}${pct}%`
}

/** "Oct 20" in IST, for chart axes and price-change markers. */
export function formatShortDate(value: string): string {
  return new Date(value).toLocaleDateString("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "numeric",
    month: "short",
  })
}

/** A journey is shown only when the website saw this lead (walk-ins have no attribution). */
export function hasAttribution(journey: LeadJourney | null | undefined): journey is LeadJourney {
  return journey != null && (journey.channel !== null || journey.visits > 0)
}

const istDayFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Kolkata",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
})

/** The IST calendar day of a timestamp as "YYYY-MM-DD", matching `daily[].date`. */
export function istDateKey(value: string): string {
  return istDayFormatter.format(new Date(value))
}

/** Per-day rate with one decimal: 9 → "9", 14.5 → "14.5", 0.13 → "0.13". */
export function formatPerDay(value: number): string {
  return value < 1 && value > 0 ? value.toFixed(2) : String(Number(value.toFixed(1)))
}
