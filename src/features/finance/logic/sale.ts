import { parseMoneyInput } from "./money"
import { buildPayment, type PaidChoice } from "./payment"

export type BuyerPaid = PaidChoice

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

  const due = price === null || price <= 0 ? null : price - alreadyReceived
  const payment = buildPayment(form, due, errors, {
    amountLabel: "amount received",
    alreadyFull: "The buyer has already paid the full price",
  })

  if (Object.keys(errors).length || price === null) return { ok: false, errors }
  return { ok: true, payload: { finalisedPrice: price, soldOn: form.soldOn, payment } }
}
