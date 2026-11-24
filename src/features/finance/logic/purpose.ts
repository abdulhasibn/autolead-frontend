import type { EntryKind, EntryPurpose } from "../types"

export const PURPOSE_LABELS: Record<EntryPurpose, string> = {
  purchase: "Payment to seller",
  cost: "Car cost",
  refund: "Refund to buyer",
  sale: "Payment from buyer",
  other: "Other car income",
  general: "Business",
}

export const PURPOSE_HINTS: Record<EntryPurpose, string> = {
  purchase: "Counts towards what we owe the seller (or the owner of a commission car)",
  cost: "Adds to landing cost (painting, service, mediator…). Commission cars: taken from the owner's payout",
  refund: "Money paid back to a buyer. Lowers what that buyer has paid",
  sale: "Counts towards what the buyer owes",
  other: "Car income that isn't the buyer's payment",
  general: "Not tied to a car",
}

export function purposeOptions(kind: EntryKind, hasCar: boolean): EntryPurpose[] {
  if (!hasCar) return ["general"]
  return kind === "expense" ? ["cost", "purchase", "refund"] : ["sale", "other"]
}

export function defaultPurpose(kind: EntryKind, hasCar: boolean): EntryPurpose {
  if (!hasCar) return "general"
  return kind === "expense" ? "cost" : "sale"
}

export const PURCHASE_TAG_NAME = "purchase"

export function isPurchaseTagName(name: string): boolean {
  return name.trim().toLowerCase() === PURCHASE_TAG_NAME
}

export interface NextPurposeInput {
  kind: EntryKind
  hasCar: boolean
  /** The purpose currently in the form. */
  current: EntryPurpose | null
  /** The admin chose the current purpose by hand. */
  userPicked: boolean
  /** The car was just set, changed or cleared. */
  carChanged?: boolean
  /** The "Purchase" tag was just added. */
  purchaseTagAdded?: boolean
}

/**
 * The purpose the form should show after a change:
 * - no car → always `general`;
 * - linking, moving or clearing the car resets to the default unless the admin picked one
 *   (and the pick still fits);
 * - adding the "Purchase" tag on a car-linked expense preselects `purchase` unless the
 *   admin picked something else;
 * - a value that no longer fits the kind/car falls back to the default.
 */
export function nextPurpose({
  kind,
  hasCar,
  current,
  userPicked,
  carChanged = false,
  purchaseTagAdded = false,
}: NextPurposeInput): EntryPurpose {
  if (!hasCar) return "general"
  const options = purposeOptions(kind, hasCar)
  const fits = current !== null && options.includes(current)

  if (userPicked && fits) return current
  if (purchaseTagAdded && kind === "expense") return "purchase"
  if (carChanged) return defaultPurpose(kind, hasCar)
  return fits ? current : defaultPurpose(kind, hasCar)
}

/**
 * What to send as `purpose` on save. On a car change the server resets the
 * purpose unless we send one, so a hand-picked value is always sent. With no
 * car the only valid purpose is "general"; it is sent explicitly because the
 * update endpoint rejects null.
 */
export function purposeForSave(purpose: EntryPurpose, hasCar: boolean): EntryPurpose {
  return hasCar ? purpose : "general"
}
