import { z } from "zod"

/** What the API accepts for a staff-entered phone: an Indian mobile, "+91" then 10 digits starting 6-9. */
export const INDIAN_MOBILE_E164_REGEX = /^\+91[6-9]\d{9}$/

export const INDIAN_MOBILE_MESSAGE = "Enter a 10-digit mobile number"

/**
 * Turns what staff type into E.164, the same rule the backend enforces: an
 * Indian mobile is 10 digits starting 6-9. "98765 43210", "09876543210",
 * "919876543210" and "+91 98765 43210" all become "+919876543210". Returns null
 * for anything else (landlines, other countries, wrong length).
 */
export function normalizeIndianPhone(input: string): string | null {
  const compact = input.trim().replace(/[\s\-().]/g, "")
  const national = compact.startsWith("+91") ? compact.slice(3) : compact.replace(/^(?:0|91)(?=\d{10}$)/, "")
  return /^[6-9]\d{9}$/.test(national) ? `+91${national}` : null
}

/** Form field: accepts a 10-digit mobile number, outputs E.164 for the API. */
export const indianPhoneFormSchema = z
  .string()
  .trim()
  .refine((value) => normalizeIndianPhone(value) !== null, INDIAN_MOBILE_MESSAGE)
  .transform((value) => normalizeIndianPhone(value) as string)

/** Same as `indianPhoneFormSchema`, but blank or null means "none". */
export const optionalIndianPhoneFormSchema = z
  .string()
  .nullable()
  .transform((value) => value?.trim() ?? "")
  .refine((value) => value === "" || normalizeIndianPhone(value) !== null, INDIAN_MOBILE_MESSAGE)
  .transform((value) => (value === "" ? null : (normalizeIndianPhone(value) as string)))
