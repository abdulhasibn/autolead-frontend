"use client"

import { useEffect, useState } from "react"
import { getCarBuyersAction } from "./actions"
import type { BuyerRow, RefundOwedRow } from "./types"

export interface CarBuyers {
  buyers: BuyerRow[]
  refundsOwed: RefundOwedRow[]
}

/**
 * The car's current buyers and refunds owed, for the entry sheet's "Paid by" /
 * "Refund to" picker. `initial` (from the car's Money tab) is used for that
 * car so the picker is ready at once; any other car is fetched. `null` while
 * loading, with no car, or when finance is locked.
 */
export function useCarBuyers(vehicleId: string | null, enabled: boolean, initial?: { vehicleId: string } & CarBuyers): CarBuyers | null {
  const [fetched, setFetched] = useState<{ vehicleId: string; data: CarBuyers | null } | null>(null)
  const fromInitial = initial && initial.vehicleId === vehicleId ? initial : null

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
  }, [vehicleId, enabled, fromInitial])

  if (!enabled || !vehicleId) return null
  if (fromInitial) return { buyers: fromInitial.buyers, refundsOwed: fromInitial.refundsOwed }
  return fetched?.vehicleId === vehicleId ? fetched.data : null
}
