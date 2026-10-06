import { serverApiClient } from "@/lib/api-client.server"
import type { DashboardPeriodKey, DashboardSummary } from "./types"

interface GetDashboardParams {
  period?: DashboardPeriodKey
  showroomId?: string
}

export async function getDashboard(
  params: GetDashboardParams = {}
): Promise<DashboardSummary> {
  const query = new URLSearchParams()
  if (params.period) query.set("period", params.period)
  if (params.showroomId) query.set("showroomId", params.showroomId)
  const qs = query.toString()
  return serverApiClient.get<DashboardSummary>(`/dashboard${qs ? `?${qs}` : ""}`)
}
