import { isFuelType, isTransmission, isVehicleStatus, VEHICLES_PAGE_SIZE } from "./constants"
import type { FuelType, Transmission, VehicleStatus } from "./types"

export type RawSearchParams = Record<string, string | string[] | undefined>

export type VehiclesLayout = "grid" | "table"

export interface VehiclesSearchParams {
  status?: VehicleStatus
  q?: string
  makeId?: string
  modelId?: string
  fuel: FuelType[]
  transmission: Transmission[]
  yearMin?: number
  yearMax?: number
  kmMin?: number
  kmMax?: number
  layout: VehiclesLayout
  page: number
}

const GUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function first(value: string | string[] | undefined): string | undefined {
  const v = Array.isArray(value) ? value[0] : value
  const trimmed = v?.trim()
  return trimmed ? trimmed : undefined
}

function guid(value: string | string[] | undefined): string | undefined {
  const v = first(value)
  return v && GUID_REGEX.test(v) ? v : undefined
}

function int(
  value: string | string[] | undefined,
  min: number,
  max: number
): number | undefined {
  const v = first(value)
  if (v === undefined) return undefined
  const n = Number(v)
  return Number.isInteger(n) && n >= min && n <= max ? n : undefined
}

function csv<T extends string>(
  value: string | string[] | undefined,
  guard: (v: unknown) => v is T
): T[] {
  const v = first(value)
  if (!v) return []
  return [...new Set(v.split(",").map((s) => s.trim()).filter(guard))]
}

/** Drops an inverted range rather than letting the API answer 422. */
function range(min?: number, max?: number): [number | undefined, number | undefined] {
  return min !== undefined && max !== undefined && min > max ? [max, min] : [min, max]
}

/** Parses the vehicles list URL state, dropping anything the API would reject. */
export function parseVehiclesSearchParams(raw: RawSearchParams): VehiclesSearchParams {
  const status = first(raw.status)
  const page = Number(first(raw.page) ?? "1")
  const [yearMin, yearMax] = range(int(raw.yearMin, 1900, 2100), int(raw.yearMax, 1900, 2100))
  const [kmMin, kmMax] = range(
    int(raw.kmMin, 0, Number.MAX_SAFE_INTEGER),
    int(raw.kmMax, 0, Number.MAX_SAFE_INTEGER)
  )
  const makeId = guid(raw.makeId)

  return {
    status: isVehicleStatus(status) ? status : undefined,
    q: first(raw.q),
    makeId,
    // A model only narrows a chosen make.
    modelId: makeId ? guid(raw.modelId) : undefined,
    fuel: csv(raw.fuel, isFuelType),
    transmission: csv(raw.transmission, isTransmission),
    yearMin,
    yearMax,
    kmMin,
    kmMax,
    layout: first(raw.layout) === "table" ? "table" : "grid",
    page: Number.isInteger(page) && page > 0 ? page : 1,
  }
}

export function pageToOffset(page: number, pageSize = VEHICLES_PAGE_SIZE): number {
  return (page - 1) * pageSize
}

/** How many filters (beyond status and search) are applied. */
export function countActiveFilters(params: VehiclesSearchParams): number {
  return [
    params.makeId,
    params.fuel.length > 0,
    params.transmission.length > 0,
    params.yearMin !== undefined || params.yearMax !== undefined,
    params.kmMin !== undefined || params.kmMax !== undefined,
  ].filter(Boolean).length
}

/** Builds a `/vehicles?…` href, omitting defaults so URLs stay clean. */
export function buildVehiclesHref(params: Partial<VehiclesSearchParams>): string {
  const query = new URLSearchParams()
  if (params.status) query.set("status", params.status)
  if (params.q) query.set("q", params.q)
  if (params.makeId) query.set("makeId", params.makeId)
  if (params.makeId && params.modelId) query.set("modelId", params.modelId)
  if (params.fuel?.length) query.set("fuel", params.fuel.join(","))
  if (params.transmission?.length) query.set("transmission", params.transmission.join(","))
  if (params.yearMin !== undefined) query.set("yearMin", String(params.yearMin))
  if (params.yearMax !== undefined) query.set("yearMax", String(params.yearMax))
  if (params.kmMin !== undefined) query.set("kmMin", String(params.kmMin))
  if (params.kmMax !== undefined) query.set("kmMax", String(params.kmMax))
  if (params.layout === "table") query.set("layout", "table")
  if (params.page && params.page > 1) query.set("page", String(params.page))
  const qs = query.toString()
  return qs ? `/vehicles?${qs}` : "/vehicles"
}

/** API query for the list, shared by the page and the per-status counts. */
export function toListQuery(params: VehiclesSearchParams) {
  return {
    search: params.q,
    makeId: params.makeId,
    modelId: params.modelId,
    fuelType: params.fuel.length ? params.fuel.join(",") : undefined,
    transmission: params.transmission.length ? params.transmission.join(",") : undefined,
    yearMin: params.yearMin,
    yearMax: params.yearMax,
    kmMin: params.kmMin,
    kmMax: params.kmMax,
  }
}
