import { formatMoney } from "./money"
import type { BuyerRow, MoneyLead, RefundOwedRow } from "../types"

/** "Asha · 98765 43210"; "Unnamed lead" when the lead has no name. */
export function leadName(lead: Pick<MoneyLead, "name"> | null): string {
  return lead?.name?.trim() || "Unnamed lead"
}

/** A picker row: who, and what they've paid net of refunds. */
export interface BuyerOption {
  id: string
  label: string
  /** Read-only: a lead who is no longer a buyer of the car (kept, not offered). */
  former?: boolean
}

export function buyerOptions(buyers: BuyerRow[]): BuyerOption[] {
  return buyers.map((b) => ({ id: b.lead.id, label: leadName(b.lead) }))
}

/**
 * Who a refund can go to: current buyers who still hold money, and former
 * buyers owed money back. Unassigned money has to be assigned first.
 */
export function refundTargets(buyers: BuyerRow[], refundsOwed: RefundOwedRow[]): Array<{ id: string; label: string; owed: number }> {
  const targets = new Map<string, { id: string; label: string; owed: number }>()
  for (const b of buyers) {
    if (b.net > 0) targets.set(b.lead.id, { id: b.lead.id, label: leadName(b.lead), owed: b.net })
  }
  for (const r of refundsOwed) {
    if (r.lead && r.owed > 0) targets.set(r.lead.id, { id: r.lead.id, label: leadName(r.lead), owed: r.owed })
  }
  return [...targets.values()]
}

/** The lead preselected for a new buyer payment: the only current buyer, else none. */
export function defaultPaidBy(buyers: BuyerRow[]): string {
  return buyers.length === 1 ? (buyers[0]?.lead.id ?? "") : ""
}

/**
 * What the lead the sale is for has paid so far (net of refunds). A sold car
 * has one buyer row; before the sale it is the chosen booked lead's row.
 * Falls back to the car-wide figure only when the car shows no buyer row.
 */
export function receivedForSale(buyers: BuyerRow[], leadId: string, carSold: boolean, fallback: number): number {
  if (carSold) return buyers.length === 1 ? (buyers[0]?.net ?? 0) : fallback
  if (!leadId) return 0
  return buyers.find((b) => b.lead.id === leadId)?.net ?? 0
}

/** Warning text for a buyer who is about to leave; null when nothing was received. */
export function buyerLeavingWarning(received: number, scope: "buyer" | "buyers" = "buyer"): string | null {
  if (!(received > 0)) return null
  const who = scope === "buyer" ? "this buyer" : "buyers on this car"
  return `${formatMoney(received)} was received from ${who}. It will show in Dues as a refund owed.`
}
