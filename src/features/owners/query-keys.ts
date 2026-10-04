import type { PaginationParams } from "@/types/api"

interface OwnersListParams extends PaginationParams {
  city?: string
  phone?: string
}

export const ownersQueryKeys = {
  all: ["owners"] as const,
  lists: () => [...ownersQueryKeys.all, "list"] as const,
  list: (params: OwnersListParams = {}) =>
    [...ownersQueryKeys.lists(), params] as const,
  details: () => [...ownersQueryKeys.all, "detail"] as const,
  detail: (id: string) => [...ownersQueryKeys.details(), id] as const,
}
