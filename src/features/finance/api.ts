import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { serverApiClient } from "@/lib/api-client.server"
import { ApiError } from "@/lib/api-error"
import type { Page } from "@/types/api"
import { clearFinanceSession, getFinanceToken, safeNextPath } from "./session"
import type {
  AwaitingSalePrice,
  CarMoney,
  CashFlowReport,
  DealTerms,
  DuesReport,
  EntryBody,
  EntryListParams,
  EntryPage,
  EntryPatch,
  FinanceEntry,
  FinanceSummary,
  FinanceTag,
  PnlReport,
  ReportPeriod,
  ShowroomOption,
  StockReport,
  VaultKeys,
  VaultStatus,
  VehicleDealState,
  VehicleMoneySummary,
  VehicleProfitReport,
  VehicleProfitSort,
  VehicleQuote,
} from "./types"

type Method = "GET" | "POST" | "PUT" | "PATCH" | "DELETE"

interface FinanceRequestOptions {
  body?: unknown
  /**
   * `strict` (default): a 423 clears the cookie and sends the admin to unlock.
   * `soft`: a 423 or 403 resolves to `null`, for places that show a
   * "locked" hint instead (vehicle Money tab, dashboard, vehicle list).
   */
  mode?: "strict" | "soft"
}

export function isFinanceLocked(err: unknown): boolean {
  return ApiError.isApiError(err) && err.status === 423
}

/** Where the admin was, so unlock can send them back. */
async function currentPath(): Promise<string> {
  const h = await headers()
  const fromProxy = h.get("x-pathname")
  if (fromProxy) return safeNextPath(fromProxy)
  const referer = h.get("referer")
  if (referer) {
    try {
      const url = new URL(referer)
      return safeNextPath(url.pathname + url.search)
    } catch {
      // fall through
    }
  }
  return "/finance"
}

/**
 * The one place a 423 FINANCE_LOCKED is handled. In a Server Function the
 * cookie can be deleted here directly; during Server Component render it
 * can't, so the admin is sent through a route handler that deletes it.
 */
export async function handleFinanceLocked(): Promise<never> {
  const next = encodeURIComponent(await currentPath())
  let cleared = false
  try {
    await clearFinanceSession()
    cleared = true
  } catch {
    // Render context: cookies are read-only here.
  }
  redirect(cleared ? `/finance/unlock?next=${next}` : `/api/finance/locked?next=${next}`)
}

async function financeRequest<T>(
  method: Method,
  endpoint: string,
  options: FinanceRequestOptions & { mode: "soft" }
): Promise<T | null>
async function financeRequest<T>(
  method: Method,
  endpoint: string,
  options?: FinanceRequestOptions
): Promise<T>
async function financeRequest<T>(
  method: Method,
  endpoint: string,
  { body, mode = "strict" }: FinanceRequestOptions = {}
): Promise<T | null> {
  const token = await getFinanceToken()
  const init = {
    // Finance figures are never cached by Next: no revalidate, no tags.
    cache: "no-store" as const,
    headers: token ? { "X-Finance-Session": token } : undefined,
  }

  try {
    switch (method) {
      case "GET":
        return await serverApiClient.get<T>(endpoint, init)
      case "POST":
        return await serverApiClient.post<T>(endpoint, body ?? {}, init)
      case "PUT":
        return await serverApiClient.put<T>(endpoint, body, init)
      case "PATCH":
        return await serverApiClient.patch<T>(endpoint, body, init)
      case "DELETE":
        return await serverApiClient.del<T>(endpoint, init)
    }
  } catch (err) {
    if (mode === "soft" && ApiError.isApiError(err) && (err.status === 423 || err.status === 403)) {
      return null
    }
    if (isFinanceLocked(err)) await handleFinanceLocked()
    throw err
  }
}

function toQuery(params: object): string {
  const query = new URLSearchParams()
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== "" && v !== false) query.set(k, String(v))
  }
  const qs = query.toString()
  return qs ? `?${qs}` : ""
}

// ---------------------------------------------------------------------------
// Vault — these never redirect on 423; the vault screens handle their states.
// ---------------------------------------------------------------------------

export async function getVaultStatus(): Promise<VaultStatus> {
  const token = await getFinanceToken()
  return serverApiClient.get<VaultStatus>("/finance/vault", {
    cache: "no-store",
    headers: token ? { "X-Finance-Session": token } : undefined,
  })
}

export async function setupVault(): Promise<VaultKeys> {
  return serverApiClient.post<VaultKeys>("/finance/vault/setup", {}, { cache: "no-store" })
}

export async function confirmVault(recoveryKey: string): Promise<VaultStatus> {
  return serverApiClient.post<VaultStatus>(
    "/finance/vault/confirm",
    { recoveryKey },
    { cache: "no-store" }
  )
}

export async function unlockVault(
  financeKey: string
): Promise<{ sessionToken: string; expiresAt: string }> {
  return serverApiClient.post("/finance/unlock", { financeKey }, { cache: "no-store" })
}

export async function lockVault(): Promise<void> {
  const token = await getFinanceToken()
  if (!token) return
  await serverApiClient.post<void>("/finance/lock", {}, {
    cache: "no-store",
    headers: { "X-Finance-Session": token },
  })
}

export async function changeFinanceKey(currentKey: string): Promise<{ financeKey: string }> {
  return financeRequest("POST", "/finance/vault/change-key", { body: { currentKey } })
}

export async function recoverVault(recoveryKey: string): Promise<VaultKeys> {
  return serverApiClient.post<VaultKeys>(
    "/finance/vault/recover",
    { recoveryKey },
    { cache: "no-store" }
  )
}

// ---------------------------------------------------------------------------
// Tags and entries
// ---------------------------------------------------------------------------

export async function getTags(includeArchived = false): Promise<FinanceTag[]> {
  return financeRequest("GET", `/finance/tags${includeArchived ? "?includeArchived=true" : ""}`)
}

export async function getTagsSoft(includeArchived = false): Promise<FinanceTag[] | null> {
  return financeRequest<FinanceTag[]>(
    "GET",
    `/finance/tags${includeArchived ? "?includeArchived=true" : ""}`,
    { mode: "soft" }
  )
}

export async function createTag(body: { name: string; color: string | null }): Promise<FinanceTag> {
  return financeRequest("POST", "/finance/tags", { body })
}

export async function updateTag(
  id: string,
  body: { name?: string; color?: string | null; archived?: boolean }
): Promise<FinanceTag> {
  return financeRequest("PATCH", `/finance/tags/${id}`, { body })
}

export async function getEntries(params: EntryListParams): Promise<EntryPage> {
  return financeRequest("GET", `/finance/entries${toQuery(params)}`)
}

export async function getEntriesSoft(params: EntryListParams): Promise<EntryPage | null> {
  return financeRequest<EntryPage>("GET", `/finance/entries${toQuery(params)}`, { mode: "soft" })
}

export async function createEntry(body: EntryBody): Promise<FinanceEntry> {
  return financeRequest("POST", "/finance/entries", { body })
}

export async function updateEntry(id: string, body: EntryPatch): Promise<FinanceEntry> {
  return financeRequest("PATCH", `/finance/entries/${id}`, { body })
}

export async function deleteEntry(id: string): Promise<void> {
  return financeRequest("DELETE", `/finance/entries/${id}`)
}

// ---------------------------------------------------------------------------
// Car money
// ---------------------------------------------------------------------------

export async function getCarMoneySoft(vehicleId: string): Promise<CarMoney | null> {
  return financeRequest<CarMoney>("GET", `/finance/vehicles/${vehicleId}`, { mode: "soft" })
}

/** PUT replaces the deal fields. `listedPrice` is never sent, so the listed-price panel stays its only editor. */
export async function setDeal(vehicleId: string, body: DealTerms): Promise<VehicleDealState> {
  return financeRequest("PUT", `/finance/vehicles/${vehicleId}`, { body })
}

export async function recordSale(
  vehicleId: string,
  body: { finalisedPrice: number; soldOn: string }
): Promise<VehicleDealState> {
  return financeRequest("POST", `/finance/vehicles/${vehicleId}/sale`, { body })
}

export async function removeSale(vehicleId: string): Promise<void> {
  return financeRequest("DELETE", `/finance/vehicles/${vehicleId}/sale`)
}

export async function addQuote(
  vehicleId: string,
  body: { amount: number; quotedOn: string; leadId: string; quotedTo: string | null; note: string | null }
): Promise<VehicleQuote> {
  return financeRequest("POST", `/finance/vehicles/${vehicleId}/quotes`, { body })
}

export async function deleteQuote(vehicleId: string, quoteId: string): Promise<void> {
  return financeRequest("DELETE", `/finance/vehicles/${vehicleId}/quotes/${quoteId}`)
}

export async function getVehicleMoneySummariesSoft(
  vehicleIds: string[]
): Promise<VehicleMoneySummary[] | null> {
  if (vehicleIds.length === 0) return []
  return financeRequest<VehicleMoneySummary[]>(
    "GET",
    `/finance/vehicles?vehicleIds=${vehicleIds.slice(0, 100).join(",")}`,
    { mode: "soft" }
  )
}

export async function getAwaitingSalePrice(): Promise<AwaitingSalePrice[]> {
  return financeRequest("GET", "/finance/vehicles/awaiting-sale-price")
}

/**
 * Everything a car's Money tab needs, or null when finance is locked (no
 * cookie → no finance call at all; a 423/403 → null, the tab shows "Unlock").
 */
export async function loadVehicleMoney(vehicleId: string): Promise<{
  money: CarMoney
  entries: EntryPage
  tags: FinanceTag[]
} | null> {
  if (!(await getFinanceToken())) return null
  const [money, entries, tags] = await Promise.all([
    getCarMoneySoft(vehicleId),
    getEntriesSoft({ vehicleId, limit: 50 }),
    getTagsSoft(true),
  ])
  if (!money || !entries || !tags) return null
  return { money, entries, tags }
}

// ---------------------------------------------------------------------------
// Reports
// ---------------------------------------------------------------------------

interface RangeParams {
  from: string
  to: string
  showroomId?: string
}

export async function getPnl(params: RangeParams & { period: ReportPeriod }): Promise<PnlReport> {
  return financeRequest("GET", `/finance/reports/pnl${toQuery(params)}`)
}

export async function getCashFlow(
  params: RangeParams & { period: ReportPeriod }
): Promise<CashFlowReport> {
  return financeRequest("GET", `/finance/reports/cash-flow${toQuery(params)}`)
}

export async function getVehicleProfit(
  params: RangeParams & { sort?: VehicleProfitSort }
): Promise<VehicleProfitReport> {
  return financeRequest("GET", `/finance/reports/vehicle-profit${toQuery(params)}`)
}

export async function getDues(params: { showroomId?: string } = {}): Promise<DuesReport> {
  return financeRequest("GET", `/finance/reports/dues${toQuery(params)}`)
}

export async function getStock(params: { showroomId?: string } = {}): Promise<StockReport> {
  return financeRequest("GET", `/finance/reports/stock${toQuery(params)}`)
}

export async function getSummary(): Promise<FinanceSummary> {
  return financeRequest("GET", "/finance/summary")
}

export async function getSummarySoft(): Promise<FinanceSummary | null> {
  return financeRequest<FinanceSummary>("GET", "/finance/summary", { mode: "soft" })
}

// ---------------------------------------------------------------------------
// Non-finance lookups used by finance screens
// ---------------------------------------------------------------------------

export async function getShowrooms(): Promise<ShowroomOption[]> {
  try {
    const page = await serverApiClient.get<Page<ShowroomOption>>("/showrooms?limit=100")
    return page.items
  } catch {
    return []
  }
}
