import { isLeadStatus, LEADS_PAGE_SIZE } from "./constants"
import type { LeadStatus } from "./types"

export type RawSearchParams = Record<string, string | string[] | undefined>

export interface LeadsSearchParams {
  status?: LeadStatus
  vehicleId?: string
  q?: string
  page: number
}

const GUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function first(value: string | string[] | undefined): string | undefined {
  const v = Array.isArray(value) ? value[0] : value
  const trimmed = v?.trim()
  return trimmed ? trimmed : undefined
}

/** Parses the leads list URL state, dropping anything the API would reject. */
export function parseLeadsSearchParams(raw: RawSearchParams): LeadsSearchParams {
  const status = first(raw.status)
  const vehicleId = first(raw.vehicleId)
  const page = Number(first(raw.page) ?? "1")

  return {
    status: isLeadStatus(status) ? status : undefined,
    vehicleId: vehicleId && GUID_REGEX.test(vehicleId) ? vehicleId : undefined,
    q: first(raw.q),
    page: Number.isInteger(page) && page > 0 ? page : 1,
  }
}

export function pageToOffset(page: number, pageSize = LEADS_PAGE_SIZE): number {
  return (page - 1) * pageSize
}

/** Builds a `/leads?…` href, omitting defaults so URLs stay clean. */
export function buildLeadsHref(params: Partial<LeadsSearchParams>): string {
  const query = new URLSearchParams()
  if (params.q) query.set("q", params.q)
  if (params.status) query.set("status", params.status)
  if (params.vehicleId) query.set("vehicleId", params.vehicleId)
  if (params.page && params.page > 1) query.set("page", String(params.page))
  const qs = query.toString()
  return qs ? `/leads?${qs}` : "/leads"
}

/** Case-insensitive match on name, email or phone (digits only for phone). */
export function matchesLeadSearch(
  lead: { contactFullName: string; contactPhone: string; contactEmail: string | null },
  q: string
): boolean {
  const needle = q.trim().toLowerCase()
  if (!needle) return true
  if (lead.contactFullName.toLowerCase().includes(needle)) return true
  if (lead.contactEmail?.toLowerCase().includes(needle)) return true
  const digits = needle.replace(/\D/g, "")
  return digits.length > 0 && lead.contactPhone.replace(/\D/g, "").includes(digits)
}
