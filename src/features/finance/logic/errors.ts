import type { ActionError } from "@/lib/action-result"

/** Plain-language copy for finance error codes. Falls back to the server's message. */
export function financeErrorMessage(error: Pick<ActionError, "code" | "message" | "status">): string {
  switch (error.code) {
    case "INVALID_FINANCE_KEY":
      return "That key didn't open the vault."
    case "FINANCE_UNLOCK_BLOCKED":
      return error.message
    case "FINANCE_TAG_NAME_TAKEN":
      return "Another tag already has that name."
    case "FINANCE_TAG_ARCHIVED":
      return "One of those tags was archived. Tags refreshed — pick again."
    case "FINANCE_TAG_NOT_FOUND":
      return "One of those tags no longer exists. Tags refreshed — pick again."
    case "DATE_RANGE_TOO_LONG":
      return "That date range is too long."
    case "DATE_RANGE_REQUIRED":
      return "Pick a date range."
    case "INVALID_DATE_RANGE":
      return "The end date is before the start date."
    case "INVALID_ENTRY_PURPOSE":
      return "That purpose doesn't fit this entry."
    case "ENTRY_SHOWROOM_FOLLOWS_VEHICLE":
      return "A car-linked entry belongs to the car's showroom."
    case "INVALID_AMOUNT":
      return "Enter an amount above zero."
    case "TOO_MANY_TAGS":
      return "Use up to 10 tags."
    case "TEXT_TOO_LONG":
      return "Party is limited to 120 characters and note to 1000."
    case "NOT_FOUND":
      return "That record no longer exists."
    case "FORBIDDEN":
      return "Finance is for admins only."
    default:
      return error.status >= 500 ? "Something went wrong. Please try again." : error.message
  }
}

/** Key fields: a VALIDATION_ERROR means the key isn't in the expected shape (doesn't count toward lockout). */
export function keyErrorMessage(error: Pick<ActionError, "code" | "message" | "status">, kind: "finance" | "recovery"): string {
  if (error.code === "VALIDATION_ERROR") {
    return kind === "finance" ? "That doesn't look like a finance key." : "That doesn't look like a recovery key."
  }
  if (error.code === "INVALID_FINANCE_KEY") {
    return kind === "finance" ? "That key didn't open the vault." : "That recovery key didn't open the vault."
  }
  return financeErrorMessage(error)
}

export const VAULT_STATE_CODES = new Set([
  "FINANCE_NOT_INITIALIZED",
  "FINANCE_VAULT_NOT_CONFIRMED",
  "FINANCE_ALREADY_INITIALIZED",
])
