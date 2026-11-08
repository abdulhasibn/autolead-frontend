const formatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
})

const plainFormatter = new Intl.NumberFormat("en-IN", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
})

/** U+2212, so losses read as a real minus sign. */
export const MINUS = "−"

/** ₹5,45,000 · −₹15,000 · ₹1,250.5 → ₹1,250.5 · null → "—" */
export function formatMoney(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return "—"
  const abs = formatter.format(Math.abs(value))
  return value < 0 ? `${MINUS}${abs}` : abs
}

/** Same as formatMoney with a leading + on gains, for net/profit deltas. */
export function formatSignedMoney(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return "—"
  return value > 0 ? `+${formatMoney(value)}` : formatMoney(value)
}

/** Indian grouping without the symbol, for money inputs: 545000 → "5,45,000". */
export function formatMoneyInput(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return ""
  return plainFormatter.format(value)
}

/**
 * Accepts what people type: "5,45,000", "₹ 5 45 000", "1250.50", "5,45,000/-".
 * Returns rupees rounded to 2 decimals, or null when it isn't a number.
 */
export function parseMoneyInput(raw: string | number | null | undefined): number | null {
  if (raw == null) return null
  if (typeof raw === "number") return Number.isFinite(raw) ? Math.round(raw * 100) / 100 : null
  const cleaned = raw
    .trim()
    .replace(/^(rs\.?|inr|₹)/i, "")
    .replace(/\/-$/, "")
    .replace(/[\s,₹]/g, "")
  if (cleaned === "") return null
  if (!/^-?\d+(\.\d{1,2})?$/.test(cleaned)) return null
  const n = Number(cleaned)
  return Number.isFinite(n) ? Math.round(n * 100) / 100 : null
}

export type MoneyTone = "positive" | "negative" | "neutral"

export function moneyTone(value: number | null | undefined): MoneyTone {
  if (value == null || value === 0) return "neutral"
  return value < 0 ? "negative" : "positive"
}
