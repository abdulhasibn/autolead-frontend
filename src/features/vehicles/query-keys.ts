import type { PaginationParams } from "@/types/api"

interface VehiclesListParams extends PaginationParams {
  status?: string
  ownerId?: string
  showroomId?: string
  registration?: string
}

export const vehiclesQueryKeys = {
  all: ["vehicles"] as const,
  lists: () => [...vehiclesQueryKeys.all, "list"] as const,
  list: (params: VehiclesListParams = {}) =>
    [...vehiclesQueryKeys.lists(), params] as const,
  details: () => [...vehiclesQueryKeys.all, "detail"] as const,
  detail: (id: string) => [...vehiclesQueryKeys.details(), id] as const,
  media: (id: string) => [...vehiclesQueryKeys.detail(id), "media"] as const,
  documents: (id: string) =>
    [...vehiclesQueryKeys.detail(id), "documents"] as const,
  statusHistory: (id: string) =>
    [...vehiclesQueryKeys.detail(id), "status-history"] as const,
}
