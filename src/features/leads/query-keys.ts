import type { LeadsListParams } from "./api"

export const leadsQueryKeys = {
  all: ["leads"] as const,
  lists: () => [...leadsQueryKeys.all, "list"] as const,
  list: (params: LeadsListParams = {}) =>
    [...leadsQueryKeys.lists(), params] as const,
  details: () => [...leadsQueryKeys.all, "detail"] as const,
  detail: (id: string) => [...leadsQueryKeys.details(), id] as const,
}
