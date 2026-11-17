/**
 * Service-role PostgREST access for the E2E suite: read-back assertions
 * ("the UI says saved; is it in the database?") and run cleanup.
 * Never point this at production: see assertNotProd() in env.ts.
 */
import { appendFileSync, existsSync, mkdirSync, readFileSync } from "node:fs"
import path from "node:path"

function requireEnv(name: string): string {
  const value = process.env[name]
  if (!value) throw new Error(`E2E: missing required env var ${name}`)
  return value
}

const supabaseUrl = () => requireEnv("SUPABASE_URL").replace(/\/$/, "")

export function serviceHeaders(): Record<string, string> {
  const key = requireEnv("SUPABASE_SERVICE_ROLE_KEY")
  return { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json" }
}

export async function rest<T = any>(
  method: string,
  path: string,
  body?: unknown,
  ok: readonly number[] = [200, 201, 204]
): Promise<T> {
  const res = await fetch(`${supabaseUrl()}${path}`, {
    method,
    headers: { ...serviceHeaders(), Prefer: "return=representation" },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  if (!ok.includes(res.status)) {
    throw new Error(`E2E ${method} ${path} -> ${res.status} ${await res.text()}`)
  }
  const text = await res.text()
  return (text ? JSON.parse(text) : null) as T
}

/** `select` helper: db.select("leads", "id=eq.x", "status,vehicle_id"). */
export function select<T = any>(table: string, filter: string, columns = "*"): Promise<T[]> {
  return rest<T[]>("GET", `/rest/v1/${table}?select=${columns}${filter ? `&${filter}` : ""}`)
}

export async function one<T = any>(table: string, filter: string, columns = "*"): Promise<T> {
  const rows = await select<T>(table, filter, columns)
  const [row] = rows
  if (rows.length !== 1 || !row) throw new Error(`E2E: expected 1 row in ${table}?${filter}, got ${rows.length}`)
  return row
}

// ---------------------------------------------------------------------------
// Registry of rows that cannot be found by creator (e.g. encrypted finance
// tags, staff users created through the API). Workers append; teardown reads.
// ---------------------------------------------------------------------------
// Outside test-results/, which Playwright empties at the start of every run.
const REGISTRY = path.resolve(__dirname, "../../../playwright/.cache/e2e-created.jsonl")

export function register(kind: "finance_tag" | "user", id: string): void {
  try {
    mkdirSync(path.dirname(REGISTRY), { recursive: true })
    appendFileSync(REGISTRY, JSON.stringify({ kind, id, prefix: process.env.E2E_PREFIX }) + "\n")
  } catch {
    /* test-results may not exist yet in odd setups; cleanup is best effort */
  }
}

function registered(prefix: string, kind: string): string[] {
  if (!existsSync(REGISTRY)) return []
  return readFileSync(REGISTRY, "utf8")
    .split("\n")
    .filter(Boolean)
    .map((l) => JSON.parse(l) as { kind: string; id: string; prefix: string })
    .filter((r) => r.prefix === prefix && r.kind === kind)
    .map((r) => r.id)
}

const inList = (ids: string[]) => `in.(${ids.join(",")})`

/**
 * Hard-deletes everything a run created, found through the run's staff users
 * (created_by / recorded_by / actor) and the run's owners -> vehicles.
 * Best effort: never throws, returns a list of problems.
 */
export async function cleanupRun(prefix: string, baseUserIds: string[]): Promise<string[]> {
  const problems: string[] = []
  const attempt = async <T>(label: string, fn: () => Promise<T>): Promise<T | undefined> => {
    try {
      return await fn()
    } catch (e) {
      problems.push(`${label}: ${(e as Error).message.slice(0, 300)}`)
      return undefined
    }
  }
  const staffIds = [...new Set([...baseUserIds, ...registered(prefix, "user")])].filter(Boolean)
  if (!staffIds.length) return problems
  const uids = inList(staffIds)

  const owners = (await attempt("owners?", () => select<{ id: string }>("owners", `created_by=${uids}`, "id"))) ?? []
  const ownerIds = owners.map((o) => o.id)
  const vehicles = ownerIds.length
    ? ((await attempt("vehicles?", () => select<{ id: string }>("vehicles", `owner_id=${inList(ownerIds)}`, "id"))) ?? [])
    : []
  const vehicleIds = vehicles.map((v) => v.id)
  const leadFilter = vehicleIds.length
    ? `or=(created_by.${uids},vehicle_id.${inList(vehicleIds)})`
    : `created_by=${uids}`
  const leads = (await attempt("leads?", () => select<{ id: string; contact_id: string }>("leads", leadFilter, "id,contact_id"))) ?? []
  const leadIds = leads.map((l) => l.id)
  const contactIds = [...new Set(leads.map((l) => l.contact_id))]

  if (vehicleIds.length) {
    await attempt("vehicles.sold_lead_id", () =>
      rest("PATCH", `/rest/v1/vehicles?id=${inList(vehicleIds)}`, { sold_lead_id: null })
    )
    await attempt("vehicle_quotes(v)", () => rest("DELETE", `/rest/v1/vehicle_quotes?vehicle_id=${inList(vehicleIds)}`))
    await attempt("finance_entries(v)", () => rest("DELETE", `/rest/v1/finance_entries?vehicle_id=${inList(vehicleIds)}`))
  }
  if (leadIds.length) {
    await attempt("vehicles.sold_lead_id(l)", () =>
      rest("PATCH", `/rest/v1/vehicles?sold_lead_id=${inList(leadIds)}`, { sold_lead_id: null })
    )
    await attempt("vehicle_quotes(l)", () => rest("DELETE", `/rest/v1/vehicle_quotes?lead_id=${inList(leadIds)}`))
  }
  await attempt("finance_entries", () => rest("DELETE", `/rest/v1/finance_entries?recorded_by=${uids}`))
  await attempt("vehicle_quotes", () => rest("DELETE", `/rest/v1/vehicle_quotes?created_by=${uids}`))
  if (leadIds.length) await attempt("leads", () => rest("DELETE", `/rest/v1/leads?id=${inList(leadIds)}`))
  if (contactIds.length) {
    // A contact shared with a lead outside this run stays (FK refuses); fine.
    for (const id of contactIds) {
      await attempt(`contact ${id}`, () => rest("DELETE", `/rest/v1/contacts?id=eq.${id}`, undefined, [200, 204, 409]))
    }
  }
  await attempt("contacts(created_by)", () => rest("DELETE", `/rest/v1/contacts?created_by=${uids}`, undefined, [200, 204, 409]))
  if (vehicleIds.length) await attempt("vehicles", () => rest("DELETE", `/rest/v1/vehicles?id=${inList(vehicleIds)}`))
  if (ownerIds.length) await attempt("owners", () => rest("DELETE", `/rest/v1/owners?id=${inList(ownerIds)}`))

  for (const t of registered(prefix, "finance_tag")) {
    await attempt(`finance_tag ${t}`, () => rest("DELETE", `/rest/v1/finance_tags?id=eq.${t}`))
  }
  for (const table of [
    "follow_ups?created_by",
    "lead_status_history?changed_by",
    "vehicle_status_history?changed_by",
    "listed_price_history?changed_by",
    "audit_logs?actor_id",
    "notifications?user_id",
    "finance_sessions?user_id",
    "leads?user_id",
  ]) {
    const [t = "", col = ""] = table.split("?")
    if (t === "leads") {
      await attempt("leads.user_id", () => rest("PATCH", `/rest/v1/leads?user_id=${uids}`, { user_id: null }))
    } else {
      await attempt(t, () => rest("DELETE", `/rest/v1/${t}?${col}=${uids}`))
    }
  }
  await attempt("user_roles", () => rest("DELETE", `/rest/v1/user_roles?user_id=${uids}`))
  await attempt("users", () => rest("DELETE", `/rest/v1/users?id=${uids}`))
  for (const id of staffIds) {
    await attempt(`auth user ${id}`, () => rest("DELETE", `/auth/v1/admin/users/${id}`, undefined, [200, 204, 404]))
  }
  return problems
}

/**
 * Removes runs that never reached teardown (interrupted or crashed), found by
 * their `e2e-<prefix>-admin|sales@example.com` users older than maxAgeMinutes.
 */
export async function sweepStaleRuns(maxAgeMinutes = 60): Promise<string[]> {
  const cutoff = new Date(Date.now() - maxAgeMinutes * 60_000).toISOString()
  const users = await select<{ id: string; email: string }>(
    "users",
    `email=like.e2e-*@example.com&created_at=lt.${cutoff}`,
    "id,email"
  )
  const byPrefix = new Map<string, string[]>()
  for (const u of users) {
    const prefix = u.email.replace(/-(admin|sales)@example\.com$/, "").replace(/@example\.com$/, "")
    byPrefix.set(prefix, [...(byPrefix.get(prefix) ?? []), u.id])
  }
  const problems: string[] = []
  for (const [prefix, ids] of byPrefix) problems.push(...(await cleanupRun(prefix, ids)))
  return problems
}
