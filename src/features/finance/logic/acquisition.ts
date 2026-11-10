import { commissionPercent as commissionPercentSchema } from "../schemas"
import type { SaleModel } from "../types"
import { parseMoneyInput } from "./money"

/** New commission cars start at this %, editable per car. */
export const DEFAULT_COMMISSION_PERCENT = "2"

export type SellerPaid = "none" | "part" | "full"

/** The money fields on the add-car form, as typed. */
export interface AcquisitionForm {
  purchaseRate: string
  purchasedOn: string
  commissionPercent: string
  paid: SellerPaid
  paidAmount: string
  paidOn: string
}

export function emptyAcquisitionForm(today: string): AcquisitionForm {
  return {
    purchaseRate: "",
    purchasedOn: today,
    commissionPercent: DEFAULT_COMMISSION_PERCENT,
    paid: "none",
    paidAmount: "",
    paidOn: today,
  }
}

/** What `recordAcquisitionAction` saves. Rupees. */
export interface AcquisitionPayload {
  purchaseRate: number | null
  commissionPercent: number | null
  purchasedOn: string | null
  /** A payment already made to the seller. */
  payment: { amount: number; paidOn: string } | null
}

export type AcquisitionResult =
  | { ok: true; payload: AcquisitionPayload | null }
  | { ok: false; errors: Partial<Record<keyof AcquisitionForm, string>> }

/** "3.5" or "3.5%" → 3.5; null when blank or not a number. */
export function parsePercent(value: string): number | null {
  const trimmed = value.trim().replace(/%$/, "").trim()
  if (trimmed === "" || !/^\d+(\.\d+)?$/.test(trimmed)) return null
  return Number(trimmed)
}

/**
 * Checks the add-car money fields and builds what to save. A purchase car may
 * be added without a price (entered later); a commission car always has a %.
 * `payload` is null when there is nothing to save.
 */
export function buildAcquisition(form: AcquisitionForm, saleModel: SaleModel): AcquisitionResult {
  const errors: Partial<Record<keyof AcquisitionForm, string>> = {}

  if (saleModel === "commission") {
    const percent = parsePercent(form.commissionPercent)
    const check = commissionPercentSchema.safeParse(percent)
    if (percent === null) errors.commissionPercent = "Enter the commission %, e.g. 2"
    else if (!check.success) errors.commissionPercent = check.error.issues[0]?.message ?? "Enter a valid %"
    if (Object.keys(errors).length || percent === null) return { ok: false, errors }
    return {
      ok: true,
      payload: { purchaseRate: null, commissionPercent: percent, purchasedOn: form.purchasedOn || null, payment: null },
    }
  }

  const rateText = form.purchaseRate.trim()
  const rate = rateText === "" ? null : parseMoneyInput(rateText)
  if (rateText !== "" && (rate === null || rate <= 0)) errors.purchaseRate = "Enter an amount above zero"

  let payment: AcquisitionPayload["payment"] = null
  if (form.paid !== "none" && !form.paidOn) errors.paidOn = "Pick the payment date"
  if (form.paid === "full") {
    if (rate === null) errors.purchaseRate ??= "Enter the purchase price to mark it fully paid"
    else payment = { amount: rate, paidOn: form.paidOn }
  } else if (form.paid === "part") {
    const amount = parseMoneyInput(form.paidAmount)
    if (amount === null || amount <= 0) errors.paidAmount = "Enter the amount paid"
    else if (rate !== null && amount >= rate) errors.paidAmount = "That’s the full price or more. Choose “Fully paid”."
    else payment = { amount, paidOn: form.paidOn }
  }

  if (Object.keys(errors).length) return { ok: false, errors }
  if (rate === null && payment === null) return { ok: true, payload: null }
  return {
    ok: true,
    payload: {
      purchaseRate: rate,
      commissionPercent: null,
      purchasedOn: rate === null ? null : form.purchasedOn || null,
      payment,
    },
  }
}
