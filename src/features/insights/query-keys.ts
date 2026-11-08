import type { InsightsPeriodKey } from "./types"

interface InsightsParams {
  period?: InsightsPeriodKey
  showroomId?: string
}

export const insightsQueryKeys = {
  all: ["insights"] as const,
  traffic: (params: InsightsParams = {}) =>
    [...insightsQueryKeys.all, "traffic", params] as const,
  vehicles: (params: InsightsParams = {}) =>
    [...insightsQueryKeys.all, "vehicles", params] as const,
  vehicle: (vehicleId: string, params: InsightsParams = {}) =>
    [...insightsQueryKeys.all, "vehicles", vehicleId, params] as const,
  demand: (params: InsightsParams = {}) =>
    [...insightsQueryKeys.all, "demand", params] as const,
  leadJourney: (leadId: string) =>
    [...insightsQueryKeys.all, "leads", leadId] as const,
}
