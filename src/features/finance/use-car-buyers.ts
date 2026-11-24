"use client"

import { useEffect, useMemo, useState } from "react"
import { getCarBuyersAction } from "./actions"
import type { BuyerRow, RefundOwedRow } from "./types"

export interface CarBuyers {
  buyers: BuyerRow[]
  refundsOwed: RefundOwedRow[]
}

/**
 * The car's current buyers and refunds owed, for the entry sheet's "Paid by" /
 * "Refund to" picker. `initial` (from the car's Money tab) is used for that
 * car so the picker is ready at once; any other car is fetched. `data` is null while
 * loading, with no car or when the lookup failed (`failed`; `retry()` tries again).
 */
export function useCarBuyers(
  vehicleId: string | null,
  enabled: boolean,
  initial?: { vehicleId: string } & CarBuyers
): { data: CarBuyers | null; failed: boolean; retry: () => void } {
  const [fetched, setFetched] = useState<{ vehicleId: string; data: CarBuyers | null } | null>(null)
  const [attempt, setAttempt] = useState(0)
  const initialBuyers = initial && initial.vehicleId === vehicleId ? initial.buyers : null
  const initialRefunds = initial && initial.vehicleId === vehicleId ? initial.refundsOwed : null
  const fromInitial = useMemo(
    () => (initialBuyers && initialRefunds ? { buyers: initialBuyers, refundsOwed: initialRefunds } : null),
    [initialBuyers, initialRefunds]
  )

  useEffect(() => {
    if (!enabled || !vehicleId || fromInitial) return
    let cancelled = false
    getCarBuyersAction(vehicleId)
      .then((result) => {
        if (!cancelled) setFetched({ vehicleId, data: result.ok ? result.data : null })
      })
      .catch(() => !cancelled && setFetched({ vehicleId, data: null }))
    return () => {
      cancelled = true
    }
  }, [vehicleId, enabled, fromInitial, attempt])

  const retry = () => {
    setFetched(null)
    setAttempt((n) => n + 1)
  }
  if (!enabled || !vehicleId) return { data: null, failed: false, retry }
  if (fromInitial) return { data: fromInitial, failed: false, retry }
  const mine = fetched?.vehicleId === vehicleId ? fetched : null
  return { data: mine?.data ?? null, failed: mine !== null && mine.data === null, retry }
}
