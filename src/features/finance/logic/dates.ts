import { addDays, differenceInCalendarDays, endOfMonth, format, parse, startOfMonth, subMonths } from "date-fns"
import type { ReportPeriod } from "../types"

export const BUSINESS_TIME_ZONE = "Asia/Kolkata"
const YMD = "yyyy-MM-dd"

/** Today's date in the business timezone, as YYYY-MM-DD. */
export function todayIST(now: Date = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: BUSINESS_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now)
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? ""
  return `${get("year")}-${get("month")}-${get("day")}`
}

/** A calendar date (local wall-clock, no UTC shift) → YYYY-MM-DD. */
export function toYmd(date: Date): string {
  return format(date, YMD)
}

/** YYYY-MM-DD → a local Date at midnight (for date-fns maths and pickers). */
export function fromYmd(value: string): Date {
  return parse(value, YMD, new Date())
}

export function isYmd(value: unknown): value is string {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(fromYmd(value).getTime())
}

export interface DateRange {
  from: string
  to: string
}

export function daysInRange({ from, to }: DateRange): number {
  return differenceInCalendarDays(fromYmd(to), fromYmd(from)) + 1
}

export const ENTRY_RANGE_MAX_DAYS = 366

/** api.md: day/week reports cover 366 days; month/year 5 years (backend: 5 × 366). */
export function rangeLimitFor(period: ReportPeriod): number {
  return period === "day" || period === "week" ? 366 : 5 * 366
}

export type RangePreset = "this-month" | "last-month" | "last-3-months" | "this-fy" | "last-12-months"

export const RANGE_PRESET_LABELS: Record<RangePreset, string> = {
  "this-month": "This month",
  "last-month": "Last month",
  "last-3-months": "Last 3 months",
  "this-fy": "This financial year",
  "last-12-months": "Last 12 months",
}

export function presetRange(preset: RangePreset, today: string = todayIST()): DateRange {
  const t = fromYmd(today)
  switch (preset) {
    case "this-month":
      return { from: toYmd(startOfMonth(t)), to: today }
    case "last-month": {
      const m = subMonths(t, 1)
      return { from: toYmd(startOfMonth(m)), to: toYmd(endOfMonth(m)) }
    }
    case "last-3-months":
      return { from: toYmd(startOfMonth(subMonths(t, 2))), to: today }
    case "last-12-months":
      return { from: toYmd(addDays(subMonths(t, 12), 1)), to: today }
    case "this-fy": {
      // Indian financial year: 1 April – 31 March.
      const year = t.getMonth() >= 3 ? t.getFullYear() : t.getFullYear() - 1
      return { from: `${year}-04-01`, to: today }
    }
  }
}

/** Null when fine, else the message to show under the picker. */
export function validateRange(range: DateRange, maxDays: number): string | null {
  if (!isYmd(range.from) || !isYmd(range.to)) return "Pick both dates."
  if (range.to < range.from) return "The end date is before the start date."
  if (daysInRange(range) > maxDays) {
    return maxDays > 366
      ? "That range is too long for this period. Pick up to 5 years, or switch to day/week for shorter ranges."
      : "Pick a range of up to 366 days."
  }
  return null
}

/** "2026-10" → "Oct 2026", "2026" → "2026", "2026-10-25" → "25 Oct". */
export function formatBucketLabel(label: string, period: ReportPeriod): string {
  if (period === "year") return label
  if (period === "month") return format(parse(label, "yyyy-MM", new Date()), "MMM yyyy")
  const d = fromYmd(label)
  return period === "week" ? `Wk ${format(d, "d MMM")}` : format(d, "d MMM")
}

/** "2026-10-25" → "25 Oct 2026" with no timezone shift. */
export function formatYmd(value: string | null | undefined): string {
  if (!value || !isYmd(value)) return "—"
  return format(fromYmd(value), "d MMM yyyy")
}
