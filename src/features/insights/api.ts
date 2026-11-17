import { serverApiClient } from "@/lib/api-client.server"
import type {
  DemandInsights,
  InsightsPeriodKey,
  LeadJourney,
  TrafficInsights,
  VehicleInsightDetail,
  VehicleInsights,
} from "./types"

interface GetInsightsParams {
  period?: InsightsPeriodKey
  showroomId?: string
}

function withQuery(path: string, params: GetInsightsParams): string {
  const query = new URLSearchParams()
  if (params.period) query.set("period", params.period)
  if (params.showroomId) query.set("showroomId", params.showroomId)
  const qs = query.toString()
  return `${path}${qs ? `?${qs}` : ""}`
}

export async function getTrafficInsights(
  params: GetInsightsParams = {}
): Promise<TrafficInsights> {
  return serverApiClient.get<TrafficInsights>(withQuery("/insights/traffic", params))
}

export async function getVehicleInsights(
  params: GetInsightsParams = {}
): Promise<VehicleInsights> {
  return serverApiClient.get<VehicleInsights>(withQuery("/insights/vehicles", params))
}

export async function getVehicleInsightDetail(
  vehicleId: string,
  params: GetInsightsParams = {}
): Promise<VehicleInsightDetail> {
  return serverApiClient.get<VehicleInsightDetail>(
    withQuery(`/insights/vehicles/${encodeURIComponent(vehicleId)}`, params)
  )
}

export async function getDemandInsights(
  params: GetInsightsParams = {}
): Promise<DemandInsights> {
  return serverApiClient.get<DemandInsights>(withQuery("/insights/demand", params))
}

export async function getLeadJourney(leadId: string): Promise<LeadJourney> {
  return serverApiClient.get<LeadJourney>(`/insights/leads/${encodeURIComponent(leadId)}`)
}
