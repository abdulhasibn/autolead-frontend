"use server"

import { revalidatePath } from "next/cache"
import { getNotifications, markNotificationRead } from "./api"
import type { NotificationPageDto } from "./types"

export async function fetchNotificationsAction(
  limit = 50
): Promise<NotificationPageDto> {
  return getNotifications({ limit })
}

export async function markNotificationReadAction(id: string): Promise<void> {
  await markNotificationRead(id)
  revalidatePath("/(dashboard)", "layout")
}
