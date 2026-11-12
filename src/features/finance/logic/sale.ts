import { parseMoneyInput } from "./money"

export type BuyerPaid = "none" | "part" | "full"

/** The sale form, as typed. */
export interface SaleForm {
  price: string
  soldOn: string
  paid: BuyerPaid
  paidAmount: string
  paidOn: string
}

/** What `recordSaleAction` saves. Rupees. */
export interface SalePayload {
  finalisedPrice: number
  soldOn: string
  /** Money already received from the buyer: saved as a `sale` income entry. */
  payment: { amount: number; paidOn: string } | null
}

export type SaleResult =
  | { ok: true; payload: SalePayload }
  | { ok: false; errors: Partial<Record<keyof SaleForm, string>> }

/**
 * Checks the sale form. `alreadyReceived` is what the buyer has paid so far
 * (sale income entries); "full" records the rest of the price, "part" must
 * leave something still owed.
 */
export function buildSale(form: SaleForm, alreadyReceived = 0): SaleResult {
  const errors: Partial<Record<keyof SaleForm, string>> = {}
  const price = parseMoneyInput(form.price)
  if (price === null || price <= 0) errors.price = "Enter the finalised price"
  if (!form.soldOn) errors.soldOn = "Pick the sale date"

  const due = price === null ? null : price - alreadyReceived
  let payment: SalePayload["payment"] = null
  if (form.paid !== "none" && !form.paidOn) errors.paidOn = "Pick the payment date"
  if (form.paid === "full") {
    if (due !== null && due <= 0) errors.paid = "The buyer has already paid the full price"
    else if (due !== null) payment = { amount: due, paidOn: form.paidOn }
  } else if (form.paid === "part") {
    const amount = parseMoneyInput(form.paidAmount)
    if (amount === null || amount <= 0) errors.paidAmount = "Enter the amount received"
    else if (due !== null && amount >= due) errors.paidAmount = "That’s the full amount or more. Choose “Fully paid”."
    else payment = { amount, paidOn: form.paidOn }
  }

  if (Object.keys(errors).length || price === null) return { ok: false, errors }
  return { ok: true, payload: { finalisedPrice: price, soldOn: form.soldOn, payment } }
}
