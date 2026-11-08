"use client"

import { useEffect, useState } from "react"
import { getVehicleMoneySummariesAction } from "./actions"
import type { VehicleMoneySummary } from "./types"

/**
 * Money summaries for a page of cars, fetched after the list renders so the
 * list never waits on finance. `null` = locked/unavailable: show nothing.
 */
export function useVehicleMoney(vehicleIds: string[], enabled: boolean): Map<string, VehicleMoneySummary> | null {
  const [data, setData] = useState<Map<string, VehicleMoneySummary> | null>(null)
  const key = enabled ? vehicleIds.join(",") : ""

  useEffect(() => {
    if (!key) return
    let cancelled = false
    getVehicleMoneySummariesAction(key.split(","))
      .then((result) => {
        if (cancelled) return
        setData(result.ok && result.data ? new Map(result.data.map((s) => [s.vehicleId, s])) : null)
      })
      .catch(() => !cancelled && setData(null))
    return () => {
      cancelled = true
    }
  }, [key])

  return key ? data : null
}
