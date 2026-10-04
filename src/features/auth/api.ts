import { serverApiClient } from "@/lib/api-client.server"
import type { UserProfileDto } from "./types"

export async function getMe(): Promise<UserProfileDto> {
  return serverApiClient.get<UserProfileDto>("/auth/me")
}
