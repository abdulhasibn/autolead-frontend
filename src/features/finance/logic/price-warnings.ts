import { formatMoney } from "./money"

/**
 * Soft checks on the money fields of a car. They only warn: an admin can still
 * save, since a minimum above the listed price or a below-minimum sale can both
 * be deliberate. All amounts are rupees; null means "not set".
 */

/** The minimum selling price sits above the price the car is listed at. */
export function minimumAboveListedWarning(minimum: number | null, listed: number | null): string | null {
  if (minimum === null || listed === null || minimum <= 0 || minimum <= listed) return null
  return `The minimum selling price (${formatMoney(minimum)}) is above the listed price (${formatMoney(listed)}). Buyers will see the listed price, so check both.`
}

/** The sale price is under the minimum selling price agreed for the car. */
export function saleBelowMinimumWarning(price: number | null, minimum: number | null): string | null {
  if (price === null || minimum === null || minimum <= 0 || price <= 0 || price >= minimum) return null
  return `This sale price (${formatMoney(price)}) is under the minimum selling price (${formatMoney(minimum)}). You can still save it.`
}
