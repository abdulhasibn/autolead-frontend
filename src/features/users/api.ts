import { serverApiClient } from "@/lib/api-client.server"
import type { Page, PaginationParams } from "@/types/api"
import type { StaffMemberDto, StaffRole } from "./types"
import type { CreateUserInput } from "./schemas"

interface UsersListParams extends PaginationParams {
  role?: StaffRole
}

export async function getUsers(
  params: UsersListParams = {}
): Promise<Page<StaffMemberDto>> {
  const query = new URLSearchParams()
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined) query.set(k, String(v))
  }
  return serverApiClient.get<Page<StaffMemberDto>>(`/users?${query}`)
}

export async function getUser(id: string): Promise<StaffMemberDto> {
  return serverApiClient.get<StaffMemberDto>(`/users/${id}`)
}

export async function createUser(
  body: CreateUserInput
): Promise<StaffMemberDto> {
  return serverApiClient.post<StaffMemberDto>("/users", body)
}

export async function updateUserRoles(
  id: string,
  roles: StaffRole[]
): Promise<StaffMemberDto> {
  return serverApiClient.put<StaffMemberDto>(`/users/${id}/roles`, { roles })
}

export async function deleteUser(id: string): Promise<void> {
  return serverApiClient.del(`/users/${id}`)
}
