import { serverApiClient } from "@/lib/api-client.server"
import type { PaginationParams } from "@/types/api"
import type { NotificationPageDto } from "./types"

export async function getNotifications(
  params: PaginationParams = {}
): Promise<NotificationPageDto> {
  const query = new URLSearchParams()
  if (params.limit) query.set("limit", String(params.limit))
  if (params.offset) query.set("offset", String(params.offset))
  return serverApiClient.get<NotificationPageDto>(
    `/notifications?${query}`
  )
}

export async function markNotificationRead(id: string): Promise<void> {
  return serverApiClient.patch(`/notifications/${id}/read`, {})
}
