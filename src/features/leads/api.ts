import { serverApiClient } from "@/lib/api-client.server"
import type { Page, PaginationParams } from "@/types/api"
import type {
  CompleteFollowUpResult,
  FollowUpDto,
  FollowUpReadModel,
  LeadPreference,
  LeadReadModel,
  LeadStatus,
  LeadStatusHistoryItem,
  LeadVehicleMatches,
  VehicleLeadMatches,
  VehicleSuggestions,
} from "./types"
import type {
  ChangeLeadStatusInput,
  CompleteFollowUpInput,
  CreateLeadInput,
  LeadPreferenceInput,
  ScheduleFollowUpInput,
  SuggestVehiclesInput,
  UpdateLeadInput,
} from "./schemas"

export interface LeadsListParams extends PaginationParams {
  status?: LeadStatus
  vehicleId?: string
  /** Admin-only; salespeople always get their own leads. */
  assignedTo?: string
  source?: string
  sort?: string
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
  if (params.source) query.set("source", params.source)
  if (params.sort) query.set("sort", params.sort)
  return serverApiClient.get<Page<LeadReadModel>>(`/leads?${query}`)
}

/** Who already owns a phone. `contact` is named for admins only (see GET /leads/contact-lookup). */
export interface ContactLookup {
  exists: boolean
  contact: { id: string; fullName: string } | null
}

export async function lookupContactByPhone(phone: string): Promise<ContactLookup> {
  return serverApiClient.get<ContactLookup>(`/leads/contact-lookup?${new URLSearchParams({ phone })}`)
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

export type FollowUpListStatus = "open" | "closed" | "all"

/** `open`: earliest first. `closed`: most recently closed first. */
export async function getLeadFollowUps(
  id: string,
  status: FollowUpListStatus
): Promise<Page<FollowUpReadModel>> {
  return serverApiClient.get<Page<FollowUpReadModel>>(
    `/leads/${id}/follow-ups?status=${status}&limit=100`
  )
}

/** Newest first; the create entry has `fromStatus: null`. */
export async function getLeadStatusHistory(
  id: string
): Promise<Page<LeadStatusHistoryItem>> {
  return serverApiClient.get<Page<LeadStatusHistoryItem>>(
    `/leads/${id}/status-history?limit=100`
  )
}

export async function completeFollowUp(
  leadId: string,
  followUpId: string,
  body: CompleteFollowUpInput
): Promise<CompleteFollowUpResult> {
  return serverApiClient.post<CompleteFollowUpResult>(
    `/leads/${leadId}/follow-ups/${followUpId}/complete`,
    body
  )
}

export async function cancelFollowUp(
  leadId: string,
  followUpId: string
): Promise<FollowUpDto> {
  return serverApiClient.post<FollowUpDto>(
    `/leads/${leadId}/follow-ups/${followUpId}/cancel`,
    {}
  )
}

/** Admin undo of a mistaken conversion: back to booking confirmed, the car back to linked. */
/** Full replace of the CRM fields (see `updateLeadSchema`). The response's names are stale; GET again. */
export async function updateLead(id: string, body: UpdateLeadInput): Promise<LeadReadModel> {
  return serverApiClient.patch<LeadReadModel>(`/leads/${id}`, body)
}

/** Admin only. `assignedTo: null` unassigns. The new assignee is notified. */
export async function assignLead(
  id: string,
  assignedTo: string | null
): Promise<{ id: string; assignedTo: string | null }> {
  return serverApiClient.put<{ id: string; assignedTo: string | null }>(`/leads/${id}/assignment`, {
    assignedTo,
  })
}

export async function reopenLead(id: string): Promise<{ status: string }> {
  return serverApiClient.post<{ status: string }>(`/leads/${id}/reopen`, {})
}

/**
 * "Mark as sold" in one request: links the car, confirms the booking and
 * converts the lead. The API checks everything first and puts the lead back if
 * a later step fails, so a sale never lands half-done.
 */
export async function sellVehicleToLead(
  id: string,
  body: { vehicleId: string; notes: string | null }
): Promise<{ status: string; vehicleSold: boolean }> {
  return serverApiClient.post<{ status: string; vehicleSold: boolean }>(`/leads/${id}/sell`, body)
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

export interface LeadVehicleMatchesParams {
  /** Lowest score a suggested car may have (API default 60). */
  minScore?: number
  /** Most suggested cars returned (API default 10, max 50). */
  limit?: number
}

/** Linked car scored against the lead, plus suggested cars from the same showroom. */
export async function getLeadVehicleMatches(
  leadId: string,
  params: LeadVehicleMatchesParams = {}
): Promise<LeadVehicleMatches> {
  const query = new URLSearchParams()
  if (params.minScore != null) query.set("minScore", String(params.minScore))
  if (params.limit != null) query.set("limit", String(params.limit))
  const qs = query.toString()
  return serverApiClient.get<LeadVehicleMatches>(
    `/leads/${leadId}/vehicle-matches${qs ? `?${qs}` : ""}`
  )
}

/** Cars scored against preferences alone, for the new-lead form. */
export async function suggestVehicles(
  body: SuggestVehiclesInput & { showroomId: string | null; minScore?: number; limit?: number }
): Promise<VehicleSuggestions> {
  return serverApiClient.post<VehicleSuggestions>("/leads/vehicle-suggestions", body)
}
