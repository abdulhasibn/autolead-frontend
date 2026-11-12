import { z } from "zod"
import { parseMoneyInput } from "./logic/money"

const ymd = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Pick a date")
const id = z.guid()

/** Rupees above zero, at most 2 decimals. */
const amount = z
  .number()
  .positive("Enter an amount above zero")
  .max(9_999_999_999)
  .refine((n) => Math.abs(n * 100 - Math.round(n * 100)) < 1e-6, "Up to 2 decimals")

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .nullable()
    .optional()
    .transform((v) => (v ? v : null))

/**
 * A key as typed. The server normalises case, spaces, dashes, O/I/L and the
 * prefix; we only cap the length so nothing silly is sent. Never logged.
 */
export const keySchema = z.string().trim().min(1, "Enter the key").max(200)

export const unlockSchema = z.object({ financeKey: keySchema })
export const recoverySchema = z.object({ recoveryKey: keySchema })
export const changeKeySchema = z.object({ currentKey: keySchema })

export const tagColorSchema = z
  .string()
  .regex(/^#[0-9A-Fa-f]{6}$/, "Use a colour like #1D9E75")
  .nullable()

export const tagNameSchema = z.string().trim().min(1, "Enter a name").max(40, "Up to 40 characters")

export const createTagSchema = z.object({ name: tagNameSchema, color: tagColorSchema.default(null) })

export const updateTagSchema = z
  .object({
    name: tagNameSchema.optional(),
    color: tagColorSchema.optional(),
    archived: z.boolean().optional(),
  })
  .refine((v) => Object.keys(v).length > 0)

export const entryKindSchema = z.enum(["income", "expense"])
export const entryPurposeSchema = z.enum(["purchase", "cost", "sale", "other", "general"])

export const entrySchema = z.object({
  kind: entryKindSchema,
  amount,
  entryDate: ymd,
  tagIds: z.array(id).max(10, "Use up to 10 tags"),
  vehicleId: id.nullable(),
  purpose: entryPurposeSchema.nullable(),
  party: optionalText(120),
  note: optionalText(1000),
  showroomId: id.nullable(),
})

export type EntryInput = z.infer<typeof entrySchema>

/** Form-level schema: money typed as text, parsed Indian style. */
export const entryFormSchema = z
  .object({
    kind: entryKindSchema,
    amount: z.string(),
    entryDate: ymd,
    tagIds: z.array(z.string()).max(10, "Use up to 10 tags"),
    vehicleId: z.string().nullable(),
    purpose: entryPurposeSchema,
    party: z.string().max(120, "Up to 120 characters"),
    note: z.string().max(1000, "Up to 1000 characters"),
    showroomId: z.string().nullable(),
  })
  .superRefine((v, ctx) => {
    const n = parseMoneyInput(v.amount)
    if (n === null || n <= 0) ctx.addIssue({ code: "custom", path: ["amount"], message: "Enter an amount above zero" })
  })

export type EntryFormValues = z.infer<typeof entryFormSchema>

/** Our % of the sale price on a commission car: above 0, up to 100, 2 decimals. */
export const commissionPercent = z
  .number()
  .gt(0, "Enter a percentage above 0")
  .max(100, "At most 100%")
  .refine((n) => Math.abs(n * 100 - Math.round(n * 100)) < 1e-6, "Up to 2 decimals")

/** A purchase car sends `purchaseRate`; a commission car sends `commissionPercent`. */
export const dealSchema = z
  .object({
    purchaseRate: amount.nullable(),
    commissionPercent: commissionPercent.nullable(),
    purchasedOn: ymd.nullable(),
    ownerExpectedPrice: amount.nullable(),
    minimumSellingPrice: amount.nullable(),
    note: optionalText(1000),
  })
  .refine((v) => (v.purchaseRate === null) !== (v.commissionPercent === null), {
    message: "Enter the purchase rate or the commission %",
  })

/** Money recorded while adding a car: the deal and a payment already made to the seller. */
export const acquisitionSchema = z
  .object({
    purchaseRate: amount.nullable(),
    commissionPercent: commissionPercent.nullable(),
    purchasedOn: ymd.nullable(),
    payment: z.object({ amount, paidOn: ymd }).nullable(),
    party: optionalText(120),
  })
  .refine((v) => v.purchaseRate === null || v.commissionPercent === null, {
    message: "Enter the purchase rate or the commission %, not both",
  })

export const saleSchema = z.object({
  finalisedPrice: amount,
  soldOn: ymd,
  /** Money already received from the buyer, saved as a `sale` income entry. */
  payment: z.object({ amount, paidOn: ymd }).nullable().default(null),
})

export const quoteSchema = z.object({
  amount,
  quotedOn: ymd,
  leadId: id,
  quotedTo: optionalText(120),
  note: optionalText(1000),
})

export const searchSchema = z.string().trim().max(100)
export const vehicleIdsSchema = z.array(id).max(100)
