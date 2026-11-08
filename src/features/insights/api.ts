import { serverApiClient } from "@/lib/api-client.server"
import { env } from "@/lib/env"
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

/** Until the backend ships the insights endpoints, `INSIGHTS_USE_FIXTURES=1` serves local JSON. */
const fixturesEnabled = () => env.INSIGHTS_USE_FIXTURES === "1"

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
  if (fixturesEnabled()) {
    return (await import("./__fixtures__/traffic.json")).default as TrafficInsights
  }
  return serverApiClient.get<TrafficInsights>(withQuery("/insights/traffic", params))
}

export async function getVehicleInsights(
  params: GetInsightsParams = {}
): Promise<VehicleInsights> {
  if (fixturesEnabled()) {
    return (await import("./__fixtures__/vehicles.json")).default as VehicleInsights
  }
  return serverApiClient.get<VehicleInsights>(withQuery("/insights/vehicles", params))
}

export async function getVehicleInsightDetail(
  vehicleId: string,
  params: GetInsightsParams = {}
): Promise<VehicleInsightDetail> {
  if (fixturesEnabled()) {
    const detail = (await import("./__fixtures__/vehicle-detail.json")).default as VehicleInsightDetail
    return { ...detail, vehicleId }
  }
  return serverApiClient.get<VehicleInsightDetail>(
    withQuery(`/insights/vehicles/${encodeURIComponent(vehicleId)}`, params)
  )
}

export async function getDemandInsights(
  params: GetInsightsParams = {}
): Promise<DemandInsights> {
  if (fixturesEnabled()) {
    return (await import("./__fixtures__/demand.json")).default as DemandInsights
  }
  return serverApiClient.get<DemandInsights>(withQuery("/insights/demand", params))
}

export async function getLeadJourney(leadId: string): Promise<LeadJourney> {
  if (fixturesEnabled()) {
    return (await import("./__fixtures__/lead-journey.json")).default as LeadJourney
  }
  return serverApiClient.get<LeadJourney>(`/insights/leads/${encodeURIComponent(leadId)}`)
}
