"use client"

import { useEffect, useState } from "react"
import { TriangleAlert } from "lucide-react"
import { getBuyerMoneyAction } from "../actions"
import { buyerLeavingWarning } from "../logic/buyers"

/**
 * What a car's current buyers have paid, for the "a buyer is leaving" warning.
 * Best effort: `null` while loading, when finance is locked, for a non-admin, or
 * on any error. Fetches only while `active`.
 */
export function useBuyerMoney(vehicleId: string | null | undefined, active: boolean) {
  const [state, setState] = useState<{ vehicleId: string; data: { buyers: Array<{ leadId: string; net: number }>; total: number } | null } | null>(null)

  useEffect(() => {
    if (!active || !vehicleId) return
    let cancelled = false
    getBuyerMoneyAction(vehicleId)
      .then((result) => {
        if (!cancelled) setState({ vehicleId, data: result.ok ? result.data : null })
      })
      .catch(() => !cancelled && setState({ vehicleId, data: null }))
    return () => {
      cancelled = true
    }
  }, [vehicleId, active])

  return active && vehicleId && state?.vehicleId === vehicleId ? state.data : null
}

/**
 * Shown before a buyer leaves a car (lead lost or moved off "booked", car
 * dropped, booking moved). It only informs: it never blocks the change, and it
 * renders nothing unless finance is unlocked for an admin and money was received.
 */
export function BuyerLeavingNotice({
  vehicleId,
  active,
  leadId,
}: {
  vehicleId: string | null | undefined
  active: boolean
  /** Only this lead's payments; omit for every current buyer of the car. */
  leadId?: string
}) {
  const money = useBuyerMoney(vehicleId, active)
  if (!money) return null
  const received = leadId ? (money.buyers.find((b) => b.leadId === leadId)?.net ?? 0) : money.total
  const text = buyerLeavingWarning(received, leadId ? "buyer" : money.buyers.length > 1 ? "buyers" : "buyer")
  if (!text) return null
  return (
    <div
      role="note"
      data-testid="buyer-leaving-warning"
      className="flex gap-2.5 rounded-lg border border-[#FDE68A] bg-warning-muted p-3 text-sm text-[#92400E]"
    >
      <TriangleAlert className="mt-0.5 size-4 shrink-0" />
      <p>{text}</p>
    </div>
  )
}
