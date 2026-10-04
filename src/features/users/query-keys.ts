import type { PaginationParams } from "@/types/api"

interface UsersListParams extends PaginationParams {
  role?: "admin" | "salesperson"
}

export const usersQueryKeys = {
  all: ["users"] as const,
  lists: () => [...usersQueryKeys.all, "list"] as const,
  list: (params: UsersListParams = {}) =>
    [...usersQueryKeys.lists(), params] as const,
  details: () => [...usersQueryKeys.all, "detail"] as const,
  detail: (id: string) => [...usersQueryKeys.details(), id] as const,
}
