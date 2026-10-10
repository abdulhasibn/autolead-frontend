import { serverApiClient } from "@/lib/api-client.server"
import type { Page, PaginationParams } from "@/types/api"
import type {
  FollowUpDto,
  LeadPreference,
  LeadReadModel,
  LeadStatus,
  VehicleLeadMatches,
} from "./types"
import type {
  ChangeLeadStatusInput,
  CreateLeadInput,
  LeadPreferenceInput,
  ScheduleFollowUpInput,
} from "./schemas"

export interface LeadsListParams extends PaginationParams {
  status?: LeadStatus
  vehicleId?: string
  /** Admin-only; salespeople always get their own leads. */
  assignedTo?: string
}

export async function getLeads(
  params: LeadsListParams = {}
): Promise<Page<LeadReadModel>> {
  const query = new URLSearchParams()
  if (params.limit) query.set("limit", String(params.limit))
  if (params.offset) query.set("offset", String(params.offset))
  if (params.status) query.set("status", params.status)
  if (params.vehicleId) query.set("vehicleId", params.vehicleId)
  if (params.assignedTo) query.set("assignedTo", params.assignedTo)
  return serverApiClient.get<Page<LeadReadModel>>(`/leads?${query}`)
}

export async function getLead(id: string): Promise<LeadReadModel> {
  return serverApiClient.get<LeadReadModel>(`/leads/${id}`)
}

export async function createLead(body: CreateLeadInput): Promise<LeadReadModel> {
  return serverApiClient.post<LeadReadModel>("/leads", body)
}

export async function changeLeadStatus(
  id: string,
  body: ChangeLeadStatusInput
): Promise<LeadReadModel> {
  return serverApiClient.post<LeadReadModel>(`/leads/${id}/status`, body)
}

export async function scheduleFollowUp(
  id: string,
  body: ScheduleFollowUpInput
): Promise<FollowUpDto> {
  return serverApiClient.post<FollowUpDto>(`/leads/${id}/follow-ups`, body)
}

export async function associateVehicle(
  id: string,
  vehicleId: string
): Promise<LeadReadModel> {
  return serverApiClient.patch<LeadReadModel>(`/leads/${id}/vehicle`, {
    vehicleId,
  })
}

/** Full replace: fields left out are cleared. Returns the normalised preference. */
export async function updateLeadPreference(
  id: string,
  body: LeadPreferenceInput
): Promise<LeadPreference> {
  return serverApiClient.put<LeadPreference>(`/leads/${id}/preference`, body)
}

export interface VehicleLeadMatchesParams {
  /** Lowest score a suggested lead may have (API default 60). */
  minScore?: number
  /** Most suggested leads returned (API default 10, max 50). */
  limit?: number
}

/** Linked leads scored against the car, plus suggested open leads. */
export async function getVehicleLeadMatches(
  vehicleId: string,
  params: VehicleLeadMatchesParams = {}
): Promise<VehicleLeadMatches> {
  const query = new URLSearchParams()
  if (params.minScore != null) query.set("minScore", String(params.minScore))
  if (params.limit != null) query.set("limit", String(params.limit))
  const qs = query.toString()
  return serverApiClient.get<VehicleLeadMatches>(
    `/leads/vehicle-matches/${vehicleId}${qs ? `?${qs}` : ""}`
  )
}
