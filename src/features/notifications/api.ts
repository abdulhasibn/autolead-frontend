import { serverApiClient } from "@/lib/api-client.server"
import type { Page, PaginationParams } from "@/types/api"
import type { NotificationReadModel } from "./types"

export async function getNotifications(
  params: PaginationParams = {}
): Promise<Page<NotificationReadModel>> {
  const query = new URLSearchParams()
  if (params.limit) query.set("limit", String(params.limit))
  if (params.offset) query.set("offset", String(params.offset))
  return serverApiClient.get<Page<NotificationReadModel>>(
    `/notifications?${query}`
  )
}

export async function markNotificationRead(id: string): Promise<void> {
  return serverApiClient.patch(`/notifications/${id}/read`, {})
}
