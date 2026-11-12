import { parseMoneyInput } from "./money"

/** How much of an agreed price has changed hands, as picked on a form. */
export type PaidChoice = "none" | "part" | "full"

export const PAID_OPTIONS: Array<{ value: PaidChoice; label: string }> = [
  { value: "none", label: "Not paid yet" },
  { value: "part", label: "Part paid" },
  { value: "full", label: "Fully paid" },
]

export interface PaymentFields {
  paid: PaidChoice
  paidAmount: string
  paidOn: string
}

export type PaymentErrors = Partial<Record<"paid" | "paidAmount" | "paidOn", string>>

/**
 * A payment against an agreed price. `due` is what's still owed (price − paid
 * so far), null when the price isn't valid yet. "full" pays all of `due`;
 * "part" must leave something owed. Returns the payment (rupees) or null.
 */
export function buildPayment(
  fields: PaymentFields,
  due: number | null,
  errors: PaymentErrors,
  copy: { amountLabel: string; alreadyFull: string }
): { amount: number; paidOn: string } | null {
  if (fields.paid === "none") return null
  if (!fields.paidOn) errors.paidOn = "Pick the payment date"
  if (fields.paid === "full") {
    if (due !== null && due <= 0) errors.paid = copy.alreadyFull
    return due !== null && due > 0 && fields.paidOn ? { amount: due, paidOn: fields.paidOn } : null
  }
  const amount = parseMoneyInput(fields.paidAmount)
  if (amount === null || amount <= 0) errors.paidAmount = `Enter the ${copy.amountLabel}`
  else if (due !== null && amount >= due) errors.paidAmount = "That’s the full amount or more. Choose “Fully paid”."
  else if (fields.paidOn) return { amount, paidOn: fields.paidOn }
  return null
}
