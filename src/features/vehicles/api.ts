import { serverApiClient } from "@/lib/api-client.server"
import type { Page, PaginationParams } from "@/types/api"
import type {
  ChangeVehicleStatusResult,
  MediaCategory,
  SignedUploadDto,
  VehicleDocumentDto,
  VehicleDto,
  VehicleMediaDto,
  VehicleStatusHistoryItem,
} from "./types"
import type { CreateVehicleInput, UpdateVehicleInput } from "./schemas"

export interface VehiclesListParams extends PaginationParams {
  status?: string
  ownerId?: string
  showroomId?: string
  registration?: string
  search?: string
  makeId?: string
  modelId?: string
  variantId?: string
  yearMin?: number
  yearMax?: number
  kmMin?: number
  kmMax?: number
  /** Comma-separated fuel types. */
  fuelType?: string
  /** Comma-separated transmissions. */
  transmission?: string
}

function toQuery(params: object): string {
  const query = new URLSearchParams()
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== "") query.set(k, String(v))
  }
  return query.toString()
}

export async function getVehicles(
  params: VehiclesListParams = {}
): Promise<Page<VehicleDto>> {
  return serverApiClient.get<Page<VehicleDto>>(`/vehicles?${toQuery(params)}`)
}

export async function getVehicle(id: string): Promise<VehicleDto> {
  return serverApiClient.get<VehicleDto>(`/vehicles/${id}`)
}

export async function createVehicle(
  body: CreateVehicleInput & { showroomId: string | null }
): Promise<VehicleDto> {
  return serverApiClient.post<VehicleDto>("/vehicles", body)
}

export async function updateVehicle(
  id: string,
  body: UpdateVehicleInput & { loanStatus: string | null }
): Promise<VehicleDto> {
  return serverApiClient.patch<VehicleDto>(`/vehicles/${id}`, body)
}

export async function changeVehicleStatus(
  id: string,
  body: { status: "open" | "dropped"; reason: string | null; confirmUnlinkLeads: boolean }
): Promise<ChangeVehicleStatusResult> {
  return serverApiClient.post<ChangeVehicleStatusResult>(`/vehicles/${id}/status`, body)
}

export async function getVehicleStatusHistory(
  id: string
): Promise<Page<VehicleStatusHistoryItem>> {
  return serverApiClient.get<Page<VehicleStatusHistoryItem>>(
    `/vehicles/${id}/status-history?limit=100`
  )
}

export async function getVehicleMedia(id: string): Promise<Page<VehicleMediaDto>> {
  return serverApiClient.get<Page<VehicleMediaDto>>(`/vehicles/${id}/media?limit=100`)
}

export async function requestMediaUpload(
  id: string,
  category: MediaCategory,
  contentType: string
): Promise<SignedUploadDto> {
  return serverApiClient.post<SignedUploadDto>(`/vehicles/${id}/media/uploads`, {
    category,
    contentType,
  })
}

export async function confirmMedia(
  id: string,
  body: { storagePath: string; category: MediaCategory; sortOrder: number }
): Promise<VehicleMediaDto> {
  return serverApiClient.post<VehicleMediaDto>(`/vehicles/${id}/media`, body)
}

export async function deleteMedia(id: string, mediaId: string): Promise<void> {
  return serverApiClient.del(`/vehicles/${id}/media/${mediaId}`)
}

export async function getVehicleDocuments(
  id: string
): Promise<Page<VehicleDocumentDto>> {
  return serverApiClient.get<Page<VehicleDocumentDto>>(
    `/vehicles/${id}/documents?limit=100`
  )
}

export async function requestDocumentUpload(
  id: string,
  docType: string,
  contentType: string
): Promise<SignedUploadDto> {
  return serverApiClient.post<SignedUploadDto>(`/vehicles/${id}/documents/uploads`, {
    docType,
    contentType,
  })
}

export async function confirmDocument(
  id: string,
  body: { storagePath: string; docType: string; fileName: string | null }
): Promise<VehicleDocumentDto> {
  return serverApiClient.post<VehicleDocumentDto>(`/vehicles/${id}/documents`, body)
}

export async function deleteDocument(id: string, documentId: string): Promise<void> {
  return serverApiClient.del(`/vehicles/${id}/documents/${documentId}`)
}
