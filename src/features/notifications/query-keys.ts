import type { PaginationParams } from "@/types/api"

export const notificationsQueryKeys = {
  all: ["notifications"] as const,
  lists: () => [...notificationsQueryKeys.all, "list"] as const,
  list: (params: PaginationParams = {}) =>
    [...notificationsQueryKeys.lists(), params] as const,
}
