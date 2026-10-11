import { serverApiClient } from "@/lib/api-client.server"
import type { UserProfileDto } from "./types"

export async function getMe(): Promise<UserProfileDto> {
  return serverApiClient.get<UserProfileDto>("/auth/me")
}

/** Which backend sessions a sign-out ends: this device's, or every one. */
export type SignOutScope = "local" | "global"

/** Ends backend sessions; their refresh tokens stop working at once. */
export async function logout(scope: SignOutScope): Promise<void> {
  return serverApiClient.post<void>("/auth/logout", { scope })
}
