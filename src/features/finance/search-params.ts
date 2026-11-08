import { daysInRange, ENTRY_RANGE_MAX_DAYS, isYmd, presetRange, rangeLimitFor, todayIST } from "./logic/dates"
import type { EntryKind, EntryListParams, EntryPurpose, EntrySort, ReportPeriod, VehicleProfitSort } from "./types"

export type RawSearchParams = Record<string, string | string[] | undefined>

export const ENTRIES_PAGE_SIZE = 25

const KINDS: EntryKind[] = ["income", "expense"]
const PURPOSES: EntryPurpose[] = ["purchase", "cost", "sale", "other", "general"]
const SORTS: EntrySort[] = ["date", "-date", "amount", "-amount"]
const PERIODS: ReportPeriod[] = ["day", "week", "month", "year"]
const PROFIT_SORTS: VehicleProfitSort[] = ["profit", "-profit", "date", "-date"]
const GUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function one(v: string | string[] | undefined): string | undefined {
  const s = Array.isArray(v) ? v[0] : v
  return s?.trim() || undefined
}

function list<T extends string>(v: string | string[] | undefined, allowed?: readonly T[], pattern?: RegExp): T[] {
  const s = one(v)
  if (!s) return []
  return s
    .split(",")
    .map((x) => x.trim())
    .filter((x): x is T => (allowed ? allowed.includes(x as T) : pattern ? pattern.test(x) : x !== ""))
}

function num(v: string | string[] | undefined): number | undefined {
  const s = one(v)
  if (!s) return undefined
  const n = Number(s.replace(/,/g, ""))
  return Number.isFinite(n) && n >= 0 ? n : undefined
}

export interface EntryFilters {
  from: string
  to: string
  kind?: EntryKind
  tagIds: string[]
  purposes: EntryPurpose[]
  vehicleId?: string
  vehicleLabel?: string
  unlinked: boolean
  minAmount?: number
  maxAmount?: number
  q?: string
  showroomId?: string
  sort: EntrySort
  page: number
  /** Null when the range is fine. */
  rangeError: string | null
}

export function parseEntrySearchParams(raw: RawSearchParams, today: string = todayIST()): EntryFilters {
  const fallback = presetRange("this-month", today)
  const from = isYmd(one(raw.from)) ? one(raw.from)! : fallback.from
  const to = isYmd(one(raw.to)) ? one(raw.to)! : fallback.to
  const vehicleId = one(raw.vehicleId)
  const kind = one(raw.kind) as EntryKind | undefined
  const sort = one(raw.sort) as EntrySort | undefined
  const page = Math.max(1, Math.floor(num(raw.page) ?? 1))
  const validCar = vehicleId && GUID.test(vehicleId) ? vehicleId : undefined

  let rangeError: string | null = null
  if (!validCar) {
    if (to < from) rangeError = "The end date is before the start date."
    else if (daysInRange({ from, to }) > ENTRY_RANGE_MAX_DAYS) rangeError = "Pick a range of up to 366 days."
  }

  const showroomId = one(raw.showroomId)
  return {
    from,
    to,
    kind: kind && KINDS.includes(kind) ? kind : undefined,
    tagIds: list(raw.tagId, undefined, GUID),
    purposes: list(raw.purpose, PURPOSES),
    vehicleId: validCar,
    vehicleLabel: validCar ? one(raw.vehicleLabel) : undefined,
    unlinked: !validCar && one(raw.unlinked) === "true",
    minAmount: num(raw.minAmount),
    maxAmount: num(raw.maxAmount),
    q: one(raw.q)?.slice(0, 100),
    showroomId: showroomId && GUID.test(showroomId) ? showroomId : undefined,
    sort: sort && SORTS.includes(sort) ? sort : "date",
    page,
    rangeError,
  }
}

/** Filters → `GET /finance/entries` query. A car's entries ignore dates (any time). */
export function toEntryQuery(f: EntryFilters): EntryListParams {
  return {
    ...(f.vehicleId ? { vehicleId: f.vehicleId } : { from: f.from, to: f.to }),
    kind: f.kind,
    tagId: f.tagIds.length ? f.tagIds.join(",") : undefined,
    purpose: f.purposes.length ? f.purposes.join(",") : undefined,
    unlinked: f.unlinked || undefined,
    minAmount: f.minAmount,
    maxAmount: f.maxAmount,
    search: f.q,
    showroomId: f.showroomId,
    sort: f.sort,
    limit: ENTRIES_PAGE_SIZE,
    offset: (f.page - 1) * ENTRIES_PAGE_SIZE,
  }
}

export function countActiveEntryFilters(f: EntryFilters): number {
  return [
    f.kind,
    f.tagIds.length > 0,
    f.purposes.length > 0,
    f.vehicleId || f.unlinked,
    f.minAmount !== undefined || f.maxAmount !== undefined,
    f.showroomId,
  ].filter(Boolean).length
}

// ---------------------------------------------------------------------------
// Reports
// ---------------------------------------------------------------------------

export type ReportTab = "pnl" | "cash-flow" | "vehicle-profit" | "dues" | "stock"
export const REPORT_TABS: ReportTab[] = ["pnl", "cash-flow", "vehicle-profit", "dues", "stock"]

export interface ReportFilters {
  tab: ReportTab
  from: string
  to: string
  period: ReportPeriod
  showroomId?: string
  sort: VehicleProfitSort
  rangeError: string | null
}

export function parseReportSearchParams(raw: RawSearchParams, today: string = todayIST()): ReportFilters {
  const tab = one(raw.tab) as ReportTab | undefined
  const period = one(raw.period) as ReportPeriod | undefined
  const sort = one(raw.sort) as VehicleProfitSort | undefined
  const fallback = presetRange("this-fy", today)
  const from = isYmd(one(raw.from)) ? one(raw.from)! : fallback.from
  const to = isYmd(one(raw.to)) ? one(raw.to)! : fallback.to
  const p: ReportPeriod = period && PERIODS.includes(period) ? period : "month"
  let rangeError: string | null = null
  if (to < from) rangeError = "The end date is before the start date."
  else if (daysInRange({ from, to }) > rangeLimitFor(p)) {
    rangeError =
      p === "day" || p === "week"
        ? "Day and week reports cover up to 366 days. Narrow the dates or switch to month."
        : "Reports cover up to 5 years."
  }
  const showroomId = one(raw.showroomId)
  return {
    tab: tab && REPORT_TABS.includes(tab) ? tab : "pnl",
    from,
    to,
    period: p,
    showroomId: showroomId && GUID.test(showroomId) ? showroomId : undefined,
    sort: sort && PROFIT_SORTS.includes(sort) ? sort : "profit",
    rangeError,
  }
}
