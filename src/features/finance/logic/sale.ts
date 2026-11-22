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
  /** The buyer's booked lead; "" until picked. */
  leadId: string
}

/** What `recordSaleAction` saves. Rupees. */
export interface SalePayload {
  finalisedPrice: number
  soldOn: string
  /** The booked lead the sale converts; null when the car is already sold. */
  leadId: string | null
  /** Money already received from the buyer: saved as a `sale` income entry. */
  payment: { amount: number; paidOn: string } | null
  /**
   * Only when the price is below what the buyer has already paid (#31):
   * "adjust" trims the buyer's payments down to the price (they were entered
   * wrong); "keep" saves the price and leaves the overpayment owed back.
   */
  buyerPayments: BuyerPaymentsChoice | null
}

export type BuyerPaymentsChoice = "adjust" | "keep"

export type SaleResult =
  | { ok: true; payload: SalePayload }
  | { ok: false; errors: Partial<Record<keyof SaleForm, string>> }

/**
 * Checks the sale form. `alreadyReceived` is what the buyer has paid so far
 * (sale income entries); "full" records the rest of the price, "part" must
 * leave something still owed. `needsLead`: the car isn't sold yet, so the
 * sale must name the buyer's booked lead.
 */
export function buildSale(form: SaleForm, alreadyReceived = 0, needsLead = false): SaleResult {
  const errors: Partial<Record<keyof SaleForm, string>> = {}
  const price = parseMoneyInput(form.price)
  if (price === null || price <= 0) errors.price = "Enter the finalised price"
  if (!form.soldOn) errors.soldOn = "Pick the sale date"
  if (needsLead && !form.leadId) errors.leadId = "Pick the buyer’s lead"

  const due = price === null || price <= 0 ? null : price - alreadyReceived
  const payment = buildPayment(form, due, errors, {
    amountLabel: "amount received",
    alreadyFull: "The buyer has already paid the full price",
  })

  if (Object.keys(errors).length || price === null) return { ok: false, errors }
  return {
    ok: true,
    payload: {
      finalisedPrice: price,
      soldOn: form.soldOn,
      leadId: needsLead ? form.leadId : null,
      payment,
      buyerPayments: null,
    },
  }
}

/** A buyer payment as the trim needs it. Rupees. */
export interface BuyerPaymentEntry {
  id: string
  amount: number
  entryDate: string
  createdAt: string
}

export interface BuyerPaymentTrim {
  /** Entries to lower, with their new amount. */
  update: { id: string; amount: number }[]
  /** Entries to delete: trimming would leave nothing. */
  remove: string[]
}

/**
 * Which buyer payments to cut so they total `excess` less: the newest first
 * (by entry date, then when recorded), since the latest entry is usually the
 * one recorded with the sale. Works in paise so rupee decimals don't drift.
 */
export function planBuyerPaymentTrim(entries: BuyerPaymentEntry[], excess: number): BuyerPaymentTrim {
  const trim: BuyerPaymentTrim = { update: [], remove: [] }
  let left = Math.round(excess * 100)
  const newestFirst = [...entries].sort(
    (a, b) => b.entryDate.localeCompare(a.entryDate) || b.createdAt.localeCompare(a.createdAt)
  )
  for (const entry of newestFirst) {
    if (left <= 0) break
    const paise = Math.round(entry.amount * 100)
    if (paise <= left) {
      trim.remove.push(entry.id)
      left -= paise
    } else {
      trim.update.push({ id: entry.id, amount: (paise - left) / 100 })
      left = 0
    }
  }
  return trim
}
