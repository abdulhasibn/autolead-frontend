import type { CarMoney, SellerPaymentStatus, VehicleMoneySummary } from "../types"
import { formatMoney } from "./money"

/** The car has no purchase rate (commission car: no commission %) yet. */
export function termsMissing(summary: Pick<VehicleMoneySummary, "saleModel" | "purchaseRate" | "commissionPercent">): boolean {
  return summary.saleModel === "commission" ? summary.commissionPercent === null : summary.purchaseRate === null
}

/**
 * One line for the entry form when recording a payment to the seller of a car
 * that has a deal: "Rate ₹X · paid ₹Y · ₹Z still owed". Null when there's
 * nothing useful to say (no terms, or a commission car not sold yet).
 */
export function sellerPaymentLine(summary: VehicleMoneySummary): string | null {
  const owed = summary.owedToSeller
  if (owed === null) return null
  const owedText =
    owed > 0 ? `${formatMoney(owed)} still owed` : owed === 0 ? "fully paid" : `overpaid by ${formatMoney(-owed)}`
  if (summary.saleModel === "commission") return `Owner’s payout from the sale: ${owedText}.`
  const rate = summary.purchaseRate ?? 0
  return `Rate ${formatMoney(rate)} · paid ${formatMoney(rate - owed)} · ${owedText}.`
}

export const SELLER_STATUS_LABELS: Record<Exclude<SellerPaymentStatus, "no_terms">, string> = {
  none: "Not paid yet",
  part: "Part paid",
  full: "Fully paid",
  overpaid: "Overpaid",
}

/** Badge text for the deal card; null while the status can't be worked out. */
export function sellerStatusLabel(money: Pick<CarMoney, "sellerPaymentStatus">): string | null {
  return money.sellerPaymentStatus === "no_terms" ? null : SELLER_STATUS_LABELS[money.sellerPaymentStatus]
}
