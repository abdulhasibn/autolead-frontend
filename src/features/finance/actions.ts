"use server"

import { revalidatePath } from "next/cache"
import { unstable_rethrow } from "next/navigation"
import { z } from "zod"
import { auth } from "@/lib/auth"
import { ApiError } from "@/lib/api-error"
import { serverApiClient } from "@/lib/api-client.server"
import { actionError, actionOk, validationError, type ActionResult } from "@/lib/action-result"
import type { Page } from "@/types/api"
import type { LeadReadModel } from "@/features/leads/types"
import type { VehicleDto } from "@/features/vehicles/types"
import { formatVehicleTitle } from "@/features/vehicles/utils"
import * as api from "./api"
import { clearFinanceSession, hasFinanceSession, setFinanceSession } from "./session"
import {
  changeKeySchema,
  createTagSchema,
  acquisitionSchema,
  dealSchema,
  entrySchema,
  ownerPayoutSchema,
  quoteSchema,
  recoverySchema,
  saleSchema,
  searchSchema,
  unlockSchema,
  updateTagSchema,
  vehicleIdsSchema,
} from "./schemas"
import type {
  BuyerRow,
  FinanceEntry,
  RefundOwedRow,
  FinanceTag,
  LeadOption,
  VaultKeys,
  VaultStatus,
  VehicleMoneySummary,
  VehicleOption,
  VehicleQuote,
} from "./types"

const idSchema = z.guid()

async function requireAdmin() {
  const session = await auth()
  if (!session?.user) throw new ApiError(401, "AUTHENTICATION_FAILED", "Not signed in")
  if (!session.user.roles?.includes("admin")) {
    throw new ApiError(403, "FORBIDDEN", "Finance is for admins only.")
  }
}

/**
 * Runs a finance action: admin check, then `run`. A 423 inside `run` makes the
 * API wrapper clear the cookie and `redirect()` to unlock — that redirect is
 * rethrown here instead of being turned into an ActionResult.
 */
async function financeAction<T>(run: () => Promise<ActionResult<T>>): Promise<ActionResult<T>> {
  try {
    await requireAdmin()
    return await run()
  } catch (err) {
    unstable_rethrow(err)
    return actionError(err)
  }
}

function revalidateFinance() {
  revalidatePath("/finance", "layout")
}

function revalidateVehicle(vehicleId: string | null | undefined) {
  if (vehicleId) revalidatePath(`/vehicles/${vehicleId}`)
}

/** A sale that converted a lead changed lead and car statuses too. */
function revalidateLeadsAndCars() {
  revalidatePath("/leads", "layout")
  revalidatePath("/vehicles", "layout")
  revalidatePath("/dashboard")
}

// ---------------------------------------------------------------------------
// Vault. Keys only pass through: never logged, stored or put in a URL.
// ---------------------------------------------------------------------------

export async function setupVaultAction(): Promise<ActionResult<VaultKeys>> {
  return financeAction(async () => actionOk(await api.setupVault()))
}

export async function confirmVaultAction(input: unknown): Promise<ActionResult<VaultStatus>> {
  return financeAction(async () => {
    const parsed = recoverySchema.safeParse(input)
    if (!parsed.success) return validationError("Enter the recovery key.")
    const status = await api.confirmVault(parsed.data.recoveryKey)
    revalidateFinance()
    return actionOk(status)
  })
}

/** Sets the httpOnly cookie. Returns only the idle deadline — never the token. */
export async function unlockAction(input: unknown): Promise<ActionResult<{ expiresAt: string }>> {
  return financeAction(async () => {
    const parsed = unlockSchema.safeParse(input)
    if (!parsed.success) return validationError("Enter your finance key.")
    const { sessionToken, expiresAt } = await api.unlockVault(parsed.data.financeKey)
    await setFinanceSession(sessionToken)
    revalidatePath("/", "layout")
    return actionOk({ expiresAt })
  })
}

/** Ends the session on the API (always 204), then drops the cookie. */
export async function lockAction(): Promise<ActionResult> {
  return financeAction(async () => {
    try {
      await api.lockVault()
    } finally {
      await clearFinanceSession()
    }
    revalidatePath("/", "layout")
    return actionOk(undefined)
  })
}

export async function changeKeyAction(input: unknown): Promise<ActionResult<{ financeKey: string }>> {
  return financeAction(async () => {
    const parsed = changeKeySchema.safeParse(input)
    if (!parsed.success) return validationError("Enter your current finance key.")
    return actionOk(await api.changeFinanceKey(parsed.data.currentKey))
  })
}

/** Every session ends on recover, so the cookie goes too. */
export async function recoverAction(input: unknown): Promise<ActionResult<VaultKeys>> {
  return financeAction(async () => {
    const parsed = recoverySchema.safeParse(input)
    if (!parsed.success) return validationError("Enter the recovery key.")
    const keys = await api.recoverVault(parsed.data.recoveryKey)
    await clearFinanceSession()
    revalidatePath("/", "layout")
    return actionOk(keys)
  })
}

// ---------------------------------------------------------------------------
// Tags
// ---------------------------------------------------------------------------

export async function listTagsAction(includeArchived = false): Promise<ActionResult<FinanceTag[]>> {
  return financeAction(async () => actionOk(await api.getTags(includeArchived === true)))
}

export async function createTagAction(input: unknown): Promise<ActionResult<FinanceTag>> {
  return financeAction(async () => {
    const parsed = createTagSchema.safeParse(input)
    if (!parsed.success) return validationError(parsed.error.issues[0]?.message)
    const tag = await api.createTag(parsed.data)
    revalidateFinance()
    return actionOk(tag)
  })
}

export async function updateTagAction(tagId: string, input: unknown): Promise<ActionResult<FinanceTag>> {
  return financeAction(async () => {
    const id = idSchema.safeParse(tagId)
    const parsed = updateTagSchema.safeParse(input)
    if (!id.success || !parsed.success) return validationError(parsed.error?.issues[0]?.message)
    const tag = await api.updateTag(id.data, parsed.data)
    revalidateFinance()
    return actionOk(tag)
  })
}

// ---------------------------------------------------------------------------
// Entries
// ---------------------------------------------------------------------------

export async function createEntryAction(input: unknown): Promise<ActionResult<FinanceEntry>> {
  return financeAction(async () => {
    const parsed = entrySchema.safeParse(input)
    if (!parsed.success) return validationError(parsed.error.issues[0]?.message)
    const entry = await api.createEntry(parsed.data)
    revalidateFinance()
    revalidateVehicle(entry.vehicle?.id)
    return actionOk(entry)
  })
}

export async function updateEntryAction(
  entryId: string,
  input: unknown,
  previousVehicleId: string | null = null
): Promise<ActionResult<FinanceEntry>> {
  return financeAction(async () => {
    const id = idSchema.safeParse(entryId)
    const parsed = entrySchema.safeParse(input)
    if (!id.success || !parsed.success) return validationError(parsed.error?.issues[0]?.message)
    // Kind is fixed once created; PATCH everything else.
    const patch: Omit<typeof parsed.data, "kind"> & { kind?: unknown } = { ...parsed.data }
    delete patch.kind
    const body = patch.vehicleId ? { ...patch, showroomId: undefined } : patch
    const entry = await api.updateEntry(id.data, body)
    revalidateFinance()
    revalidateVehicle(entry.vehicle?.id)
    if (typeof previousVehicleId === "string") revalidateVehicle(previousVehicleId)
    return actionOk(entry)
  })
}

export async function deleteEntryAction(entryId: string, vehicleId: string | null = null): Promise<ActionResult> {
  return financeAction(async () => {
    const id = idSchema.safeParse(entryId)
    if (!id.success) return validationError()
    await api.deleteEntry(id.data)
    revalidateFinance()
    if (typeof vehicleId === "string") revalidateVehicle(vehicleId)
    return actionOk(undefined)
  })
}

// ---------------------------------------------------------------------------
// Car money
// ---------------------------------------------------------------------------

export async function setDealAction(vehicleId: string, input: unknown): Promise<ActionResult> {
  return financeAction(async () => {
    const id = idSchema.safeParse(vehicleId)
    const parsed = dealSchema.safeParse(input)
    if (!id.success || !parsed.success) return validationError(parsed.error?.issues[0]?.message)
    const { payment, ...terms } = parsed.data
    // One request: the API saves the payment entry with the deal, or neither.
    await api.setDeal(id.data, { ...terms, sellerPayment: payment })
    revalidateVehicle(id.data)
    revalidateFinance()
    return actionOk(undefined)
  })
}

/** Records a payout to the owner of a sold commission car as a "payment to seller" entry. */
export async function payOwnerAction(vehicleId: string, input: unknown): Promise<ActionResult> {
  return financeAction(async () => {
    const id = idSchema.safeParse(vehicleId)
    const parsed = ownerPayoutSchema.safeParse(input)
    if (!id.success || !parsed.success) return validationError(parsed.error?.issues[0]?.message)
    await api.createEntry({
      kind: "expense",
      amount: parsed.data.amount,
      entryDate: parsed.data.paidOn,
      tagIds: [],
      vehicleId: id.data,
      purpose: "purchase",
      party: null,
      note: "Paid to the owner from the sale",
      showroomId: null,
    })
    revalidateVehicle(id.data)
    revalidateFinance()
    return actionOk(undefined)
  })
}

/**
 * Saves the money side of a car just added: its deal (purchase rate or
 * commission %) and any payment already made to the seller, as a `purchase`
 * expense. Only offered while finance is unlocked.
 */
export async function recordAcquisitionAction(vehicleId: string, input: unknown): Promise<ActionResult> {
  return financeAction(async () => {
    const id = idSchema.safeParse(vehicleId)
    const parsed = acquisitionSchema.safeParse(input)
    if (!id.success || !parsed.success) return validationError(parsed.error?.issues[0]?.message)
    const { purchaseRate, commissionPercent, purchasedOn, payment, party } = parsed.data
    if (payment && purchaseRate !== null) {
      // The payment needs the deal: save both in one request (the seller's name rides on the note).
      await api.createEntry({
        kind: "expense",
        amount: payment.amount,
        entryDate: payment.paidOn,
        tagIds: [],
        vehicleId: id.data,
        purpose: "purchase",
        party,
        note: "Paid to the seller when the car was added",
        showroomId: null,
        deal: { purchaseRate, commissionPercent: null, purchasedOn },
      })
    } else if (purchaseRate !== null || commissionPercent !== null) {
      await api.setDeal(id.data, {
        purchaseRate,
        commissionPercent,
        purchasedOn,
        ownerExpectedPrice: null,
        minimumSellingPrice: null,
        note: null,
      })
    }
    revalidateVehicle(id.data)
    revalidateFinance()
    return actionOk(undefined)
  })
}

export async function recordSaleAction(vehicleId: string, input: unknown): Promise<ActionResult> {
  return financeAction(async () => {
    const id = idSchema.safeParse(vehicleId)
    const parsed = saleSchema.safeParse(input)
    if (!id.success || !parsed.success) return validationError(parsed.error?.issues[0]?.message)
    const { payment, buyerPayments, ...sale } = parsed.data
    try {
      // With a lead, this also converts it: the car becomes sold and its other leads are freed.
      // The buyer's payment travels in the same request, so it lands with the sale or not at all.
      // "adjust": the server cuts the sale lead's payments down to the price (other buyers' money
      // is never touched) and undoes that if the sale then fails.
      await api.recordSale(id.data, {
        ...sale,
        keepOverpayment: buyerPayments === "keep",
        ...(buyerPayments === "adjust" ? { buyerPayments: "adjust" as const } : {}),
        buyerPayment: payment ? { amount: payment.amount, paidOn: payment.paidOn } : null,
      })
    } finally {
      // A failed save may still have changed nothing, but the page numbers are cheap to refresh.
      revalidateVehicle(id.data)
      revalidateFinance()
      if (sale.leadId) revalidateLeadsAndCars()
    }
    return actionOk(undefined)
  })
}

/**
 * Removes a sale recorded by mistake. The server deletes the sold lead's buyer
 * payments with it; payments from other buyers stay as refunds owed.
 */
export async function removeSaleAction(vehicleId: string): Promise<ActionResult> {
  return financeAction(async () => {
    const id = idSchema.safeParse(vehicleId)
    if (!id.success) return validationError()
    await api.removeSale(id.data, { withBuyerPayments: true })
    revalidateVehicle(id.data)
    revalidateFinance()
    return actionOk(undefined)
  })
}

/**
 * For the "a buyer is leaving" warning: what the car's current buyers have paid
 * (net of refunds), or null when finance is locked, the caller isn't an admin or
 * the car has no buyers. Best effort: never throws, never redirects.
 */
export async function getBuyerMoneyAction(
  vehicleId: string
): Promise<ActionResult<{ buyers: Array<{ leadId: string; net: number }>; total: number } | null>> {
  try {
    const session = await auth()
    if (!session?.user?.roles?.includes("admin")) return actionOk(null)
    if (!(await hasFinanceSession())) return actionOk(null)
    const id = idSchema.safeParse(vehicleId)
    if (!id.success) return actionOk(null)
    const money = await api.getCarMoneySoft(id.data)
    if (!money) return actionOk(null)
    const buyers = money.buyers.map((b) => ({ leadId: b.lead.id, net: b.net }))
    return actionOk({ buyers, total: buyers.reduce((sum, b) => sum + Math.max(0, b.net), 0) })
  } catch (err) {
    unstable_rethrow(err)
    return actionOk(null)
  }
}

/** The buyers and refunds owed of a car, for the entry sheet's "Paid by" picker. Null when unavailable. */
export async function getCarBuyersAction(
  vehicleId: string
): Promise<ActionResult<{ buyers: BuyerRow[]; refundsOwed: RefundOwedRow[] } | null>> {
  return financeAction(async () => {
    const id = idSchema.safeParse(vehicleId)
    if (!id.success) return validationError()
    const money = await api.getCarMoneySoft(id.data)
    return actionOk(money ? { buyers: money.buyers, refundsOwed: money.refundsOwed } : null)
  })
}

/**
 * Puts the car's unassigned buyer money (older `sale`/`refund` entries with no lead) on a lead:
 * a lead-only PATCH per entry. Entries that already have a lead are left alone.
 */
export async function assignBuyerMoneyAction(vehicleId: string, leadId: string): Promise<ActionResult<{ assigned: number }>> {
  return financeAction(async () => {
    const id = idSchema.safeParse(vehicleId)
    const lead = idSchema.safeParse(leadId)
    if (!id.success || !lead.success) return validationError()
    const unassigned: FinanceEntry[] = []
    for (let offset = 0; ; offset += 100) {
      const page = await api.getEntries({ vehicleId: id.data, purpose: "sale,refund", limit: 100, offset })
      unassigned.push(...page.items.filter((entry) => entry.lead === null))
      if (page.items.length === 0 || offset + page.items.length >= page.total) break
    }
    try {
      for (const entry of unassigned) await api.updateEntry(entry.id, { leadId: lead.data })
    } finally {
      revalidateVehicle(id.data)
      revalidateFinance()
    }
    return actionOk({ assigned: unassigned.length })
  })
}

export async function addQuoteAction(vehicleId: string, input: unknown): Promise<ActionResult<VehicleQuote>> {
  return financeAction(async () => {
    const id = idSchema.safeParse(vehicleId)
    const parsed = quoteSchema.safeParse(input)
    if (!id.success || !parsed.success) return validationError(parsed.error?.issues[0]?.message)
    const quote = await api.addQuote(id.data, parsed.data)
    revalidateVehicle(id.data)
    return actionOk(quote)
  })
}

export async function deleteQuoteAction(vehicleId: string, quoteId: string): Promise<ActionResult> {
  return financeAction(async () => {
    const id = idSchema.safeParse(vehicleId)
    const quote = idSchema.safeParse(quoteId)
    if (!id.success || !quote.success) return validationError()
    await api.deleteQuote(id.data, quote.data)
    revalidateVehicle(id.data)
    return actionOk(undefined)
  })
}

/** For the vehicles list. Never redirects: a locked vault just yields null. */
export async function getVehicleMoneySummariesAction(
  vehicleIds: unknown
): Promise<ActionResult<VehicleMoneySummary[] | null>> {
  return financeAction(async () => {
    const parsed = vehicleIdsSchema.safeParse(vehicleIds)
    if (!parsed.success) return validationError()
    return actionOk(await api.getVehicleMoneySummariesSoft(parsed.data))
  })
}

// ---------------------------------------------------------------------------
// Picker lookups (regular, non-finance endpoints)
// ---------------------------------------------------------------------------

export async function searchVehiclesAction(query: unknown): Promise<ActionResult<VehicleOption[]>> {
  return financeAction(async () => {
    const parsed = searchSchema.safeParse(query)
    if (!parsed.success) return validationError()
    const qs = new URLSearchParams({ limit: "10" })
    if (parsed.data) qs.set("search", parsed.data)
    const page = await serverApiClient.get<Page<VehicleDto>>(`/vehicles?${qs}`)
    return actionOk(
      page.items.map((v) => ({ id: v.id, label: `${formatVehicleTitle(v)} · ${v.registrationNumber}` }))
    )
  })
}

export async function searchLeadsAction(query: unknown): Promise<ActionResult<LeadOption[]>> {
  return financeAction(async () => {
    const parsed = searchSchema.safeParse(query)
    if (!parsed.success) return validationError()
    const qs = new URLSearchParams({ limit: "10" })
    if (parsed.data) qs.set("search", parsed.data)
    const page = await serverApiClient.get<Page<LeadReadModel>>(`/leads?${qs}`)
    return actionOk(page.items.map((l) => ({ id: l.id, name: l.contactFullName, phone: l.contactPhone })))
  })
}
