import type { PaginationParams } from "@/types/api"

interface LeadsListParams extends PaginationParams {
  status?: string
  vehicleId?: string
}

export const leadsQueryKeys = {
  all: ["leads"] as const,
  lists: () => [...leadsQueryKeys.all, "list"] as const,
  list: (params: LeadsListParams = {}) =>
    [...leadsQueryKeys.lists(), params] as const,
  details: () => [...leadsQueryKeys.all, "detail"] as const,
  detail: (id: string) => [...leadsQueryKeys.details(), id] as const,
}
