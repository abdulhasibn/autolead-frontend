import type { DashboardPeriodKey } from "./types"

interface DashboardParams {
  period?: DashboardPeriodKey
  showroomId?: string
}

export const dashboardQueryKeys = {
  all: ["dashboard"] as const,
  summaries: () => [...dashboardQueryKeys.all, "summary"] as const,
  summary: (params: DashboardParams = {}) =>
    [...dashboardQueryKeys.summaries(), params] as const,
}
