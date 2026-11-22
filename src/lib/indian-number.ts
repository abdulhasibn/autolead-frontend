/**
 * Indian digit grouping for number inputs, applied while the user types:
 * 1234567 → "12,34,567" (last three digits, then pairs).
 */

/** Groups a run of digits the Indian way. Non-digits are not expected here. */
export function groupIndian(digits: string): string {
  const trimmed = digits.replace(/^0+(?=\d)/, "")
  if (trimmed.length <= 3) return trimmed
  const last3 = trimmed.slice(-3)
  const rest = trimmed.slice(0, -3)
  return `${rest.replace(/\B(?=(\d{2})+(?!\d))/g, ",")},${last3}`
}

export interface FormatOptions {
  /** Keep one decimal point and up to `maxDecimals` digits after it. */
  allowDecimal?: boolean
  maxDecimals?: number
}

/** Formats whatever is in the field ("₹5,45,000/-", "545000", "1250.5"). */
export function formatIndianNumberText(raw: string, options: FormatOptions = {}): string {
  return reformatWithCaret(raw, raw.length, options).value
}

/** Strips grouping so the text can go through Number(): "5,45,000" → "545000". */
export function stripGrouping(text: string): string {
  return text.replace(/[,\s]/g, "")
}

/** Keeps digits (and one "." when decimals are allowed); counts what stays before the caret. */
function clean(raw: string, caret: number, options: FormatOptions) {
  const maxDecimals = options.maxDecimals ?? 2
  // "₹5,45,000/-" — drop a trailing "/-" so its characters don't count as digits.
  const source = raw.replace(/\/-\s*$/, "")
  let intPart = ""
  let decPart = ""
  let hasDot = false
  let kept = 0
  let keptBeforeCaret = 0
  for (let i = 0; i < source.length; i++) {
    const ch = source.charAt(i)
    let keep = false
    if (ch >= "0" && ch <= "9") {
      if (!hasDot) {
        intPart += ch
        keep = true
      } else if (decPart.length < maxDecimals) {
        decPart += ch
        keep = true
      }
    } else if (ch === "." && options.allowDecimal && !hasDot) {
      hasDot = true
      keep = true
    }
    if (keep) {
      kept++
      if (i < caret) keptBeforeCaret = kept
    }
  }
  return { intPart, decPart, hasDot, keptBeforeCaret }
}

/**
 * Re-groups the field text and works out where the caret should land, so that
 * typing or deleting in the middle of "12,34,567" doesn't throw the cursor to
 * the end. The caret is tracked by how many kept characters precede it.
 */
export function reformatWithCaret(
  raw: string,
  caret: number,
  options: FormatOptions = {}
): { value: string; caret: number } {
  const { intPart, decPart, hasDot, keptBeforeCaret } = clean(raw, caret, options)
  // A leading "." becomes "0." so the number still parses.
  const intText = intPart === "" && hasDot ? "0" : intPart
  const grouped = groupIndian(intText)
  const value = hasDot ? `${grouped}.${decPart}` : grouped

  // Leading zeros dropped by groupIndian shift the kept-character count.
  const droppedZeros = intText.length - grouped.replace(/,/g, "").length + (intPart === "" && hasDot ? -1 : 0)
  let target = Math.max(0, keptBeforeCaret - droppedZeros)
  let pos = 0
  while (pos < value.length && target > 0) {
    if (value[pos] !== ",") target--
    pos++
  }
  return { value, caret: pos }
}
