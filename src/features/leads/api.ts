import { serverApiClient } from "@/lib/api-client.server"
import type { Page, PaginationParams } from "@/types/api"
import type {
  AssociateVehicleResult,
  ChangeLeadStatusResult,
  FollowUpDto,
  LeadReadModel,
  LeadStatus,
} from "./types"
import type { CreateLeadInput, ChangeLeadStatusInput, ScheduleFollowUpInput } from "./schemas"

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
): Promise<ChangeLeadStatusResult> {
  return serverApiClient.post<ChangeLeadStatusResult>(`/leads/${id}/status`, body)
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
): Promise<AssociateVehicleResult> {
  return serverApiClient.patch<AssociateVehicleResult>(`/leads/${id}/vehicle`, {
    vehicleId,
  })
}
