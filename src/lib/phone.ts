import { z } from "zod"

/** The backend Phone value object: "+" then 7–15 digits. */
export const E164_REGEX = /^\+[1-9]\d{6,14}$/

/**
 * Turns what staff type into E.164. A bare 10-digit number is Indian, so
 * "98765 43210", "09876543210" and "919876543210" all become "+919876543210".
 * Anything already starting with "+" is kept as typed. Returns null when it
 * can't be read as a phone number.
 */
export function normalizeIndianPhone(input: string): string | null {
  const compact = input.trim().replace(/[\s\-().]/g, "")
  if (compact.startsWith("+")) return E164_REGEX.test(compact) ? compact : null
  const digits = compact.replace(/^(?:0|91)(?=\d{10}$)/, "")
  return /^\d{10}$/.test(digits) ? `+91${digits}` : null
}

/** Form field: accepts a 10-digit mobile number, outputs E.164 for the API. */
export const indianPhoneFormSchema = z
  .string()
  .trim()
  .refine((value) => normalizeIndianPhone(value) !== null, "Enter a 10-digit mobile number")
  .transform((value) => normalizeIndianPhone(value) as string)

/** Same as `indianPhoneFormSchema`, but blank or null means "none". */
export const optionalIndianPhoneFormSchema = z
  .union([z.null(), indianPhoneFormSchema.or(z.literal(""))])
  .transform((value) => (value ? value : null))
