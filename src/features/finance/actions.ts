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
import { clearFinanceSession, setFinanceSession } from "./session"
import {
  changeKeySchema,
  createTagSchema,
  dealSchema,
  entrySchema,
  quoteSchema,
  recoverySchema,
  saleSchema,
  searchSchema,
  unlockSchema,
  updateTagSchema,
  vehicleIdsSchema,
} from "./schemas"
import type {
  FinanceEntry,
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
    await api.setDeal(id.data, parsed.data)
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
    await api.recordSale(id.data, parsed.data)
    revalidateVehicle(id.data)
    revalidateFinance()
    return actionOk(undefined)
  })
}

export async function removeSaleAction(vehicleId: string): Promise<ActionResult> {
  return financeAction(async () => {
    const id = idSchema.safeParse(vehicleId)
    if (!id.success) return validationError()
    await api.removeSale(id.data)
    revalidateVehicle(id.data)
    revalidateFinance()
    return actionOk(undefined)
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
