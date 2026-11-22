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

/** Public. Emails a 6-digit code; the same answer whether or not the account exists. */
export async function forgotPassword(email: string): Promise<{ message: string }> {
  return serverApiClient.post<{ message: string }>("/auth/forgot-password", { email })
}

/** Public. Sets a new password with the emailed code; every session ends. */
export async function resetPassword(body: {
  email: string
  code: string
  newPassword: string
}): Promise<void> {
  return serverApiClient.post<void>("/auth/reset-password", body)
}

/** Signed in. Other devices are signed out; this session stays. */
export async function changePassword(body: {
  currentPassword: string
  newPassword: string
}): Promise<void> {
  return serverApiClient.post<void>("/auth/change-password", body)
}
