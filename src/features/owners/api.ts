import { serverApiClient } from "@/lib/api-client.server"
import type { Page, PaginationParams } from "@/types/api"
import type { OwnerDto } from "./types"
import type { CreateOwnerInput } from "./schemas"

interface OwnersListParams extends PaginationParams {
  city?: string
  phone?: string
}

export async function getOwners(
  params: OwnersListParams = {}
): Promise<Page<OwnerDto>> {
  const query = new URLSearchParams()
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined) query.set(k, String(v))
  }
  return serverApiClient.get<Page<OwnerDto>>(`/owners?${query}`)
}

export async function getOwner(id: string): Promise<OwnerDto> {
  return serverApiClient.get<OwnerDto>(`/owners/${id}`)
}

export async function createOwner(body: CreateOwnerInput): Promise<OwnerDto> {
  return serverApiClient.post<OwnerDto>("/owners", body)
}

export async function updateOwner(
  id: string,
  body: Partial<CreateOwnerInput>
): Promise<OwnerDto> {
  return serverApiClient.patch<OwnerDto>(`/owners/${id}`, body)
}

export async function deleteOwner(id: string): Promise<void> {
  return serverApiClient.del(`/owners/${id}`)
}
