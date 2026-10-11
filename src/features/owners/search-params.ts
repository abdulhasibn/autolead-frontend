export const OWNERS_PAGE_SIZE = 25

export type RawSearchParams = Record<string, string | string[] | undefined>

export interface OwnersSearchParams {
  q?: string
  city?: string
  page: number
}

function first(value: string | string[] | undefined): string | undefined {
  const v = Array.isArray(value) ? value[0] : value
  const trimmed = v?.trim()
  return trimmed ? trimmed : undefined
}

export function parseOwnersSearchParams(raw: RawSearchParams): OwnersSearchParams {
  const page = Number(first(raw.page) ?? "1")
  return {
    q: first(raw.q),
    city: first(raw.city),
    page: Number.isInteger(page) && page > 0 ? page : 1,
  }
}

export function pageToOffset(page: number, pageSize = OWNERS_PAGE_SIZE): number {
  return (page - 1) * pageSize
}

export function buildOwnersHref(params: Partial<OwnersSearchParams>): string {
  const query = new URLSearchParams()
  if (params.q) query.set("q", params.q)
  if (params.city) query.set("city", params.city)
  if (params.page && params.page > 1) query.set("page", String(params.page))
  const qs = query.toString()
  return qs ? `/owners?${qs}` : "/owners"
}
