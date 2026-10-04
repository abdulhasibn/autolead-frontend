import { serverApiClient } from "@/lib/api-client.server"
import type { Page, PaginationParams } from "@/types/api"
import type {
  VehicleDto,
  VehicleMediaDto,
  VehicleDocumentDto,
  SignedUploadDto,
  MediaCategory,
  DocumentType,
} from "./types"
import type { CreateVehicleInput } from "./schemas"

interface VehiclesListParams extends PaginationParams {
  status?: string
  ownerId?: string
  showroomId?: string
  registration?: string
}

export async function getVehicles(
  params: VehiclesListParams = {}
): Promise<Page<VehicleDto>> {
  const query = new URLSearchParams()
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined) query.set(k, String(v))
  }
  return serverApiClient.get<Page<VehicleDto>>(`/vehicles?${query}`)
}

export async function getVehicle(id: string): Promise<VehicleDto> {
  return serverApiClient.get<VehicleDto>(`/vehicles/${id}`)
}

export async function createVehicle(
  body: CreateVehicleInput
): Promise<VehicleDto> {
  return serverApiClient.post<VehicleDto>("/vehicles", body)
}

export async function changeVehicleStatus(
  id: string,
  status: string,
  reason: string | null = null
): Promise<{ status: string }> {
  return serverApiClient.post<{ status: string }>(`/vehicles/${id}/status`, {
    status,
    reason,
  })
}

export async function getVehicleMedia(
  id: string
): Promise<Page<VehicleMediaDto>> {
  return serverApiClient.get<Page<VehicleMediaDto>>(`/vehicles/${id}/media`)
}

export async function requestMediaUpload(
  id: string,
  category: MediaCategory,
  contentType: string
): Promise<SignedUploadDto> {
  return serverApiClient.post<SignedUploadDto>(
    `/vehicles/${id}/media/uploads`,
    { category, contentType }
  )
}

export async function getVehicleDocuments(
  id: string
): Promise<Page<VehicleDocumentDto>> {
  return serverApiClient.get<Page<VehicleDocumentDto>>(
    `/vehicles/${id}/documents`
  )
}

export async function requestDocumentUpload(
  id: string,
  docType: DocumentType,
  contentType: string
): Promise<SignedUploadDto> {
  return serverApiClient.post<SignedUploadDto>(
    `/vehicles/${id}/documents/uploads`,
    { docType, contentType }
  )
}
