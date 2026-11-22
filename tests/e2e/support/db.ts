/**
 * Service-role PostgREST access for the E2E suite: read-back assertions
 * ("the UI says saved; is it in the database?") and run cleanup.
 * Never point this at production: see assertNotProd() in env.ts.
 */
import { appendFileSync, existsSync, mkdirSync, readFileSync } from "node:fs"
import path from "node:path"
import { groupByRun } from "./run-prefix"

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
    // Files first: deleting the vehicle cascades its media/document rows, and
    // nothing would point at the files any more.
    for (const [table, bucket] of [
      ["vehicle_media", "vehicle-media"],
      ["vehicle_documents", "vehicle-documents"],
    ] as const) {
      const files =
        (await attempt(`${table}?`, () =>
          select<{ storage_path: string }>(table, `vehicle_id=${inList(vehicleIds)}`, "storage_path")
        )) ?? []
      if (files.length) {
        await attempt(`storage ${bucket}`, () =>
          rest("DELETE", `/storage/v1/object/${bucket}`, { prefixes: files.map((f) => f.storage_path) })
        )
      }
    }
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
  if (leadIds.length) {
    // Website test-drive leads notify every admin, real ones included: remove
    // notifications about this run's leads whoever received them.
    await attempt("notifications(lead)", () =>
      rest("DELETE", `/rest/v1/notifications?or=(entity_id.${inList(leadIds)},lead_id.${inList(leadIds)})`)
    )
  }
  if (vehicleIds.length) {
    await attempt("notifications(vehicle)", () =>
      rest("DELETE", `/rest/v1/notifications?entity_id=${inList(vehicleIds)}`)
    )
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

export interface LeftoverRun {
  prefix: string
  userIds: string[]
  createdAt: string
}

/**
 * E2E runs whose staff users still exist, i.e. runs that never reached
 * teardown (interrupted, crashed, or copied by a database dump mid-run).
 * Found by their `<prefix>-<label>@example.com` users, oldest first.
 */
export async function findLeftoverRuns(olderThanMinutes = 0): Promise<LeftoverRun[]> {
  const cutoff = new Date(Date.now() - olderThanMinutes * 60_000).toISOString()
  const users = await select<{ id: string; email: string; created_at: string }>(
    "users",
    `email=like.e2e-*@example.com&created_at=lt.${cutoff}&order=created_at.asc`,
    "id,email,created_at"
  )
  return [...groupByRun(users)].map(([prefix, us]) => ({
    prefix,
    userIds: us.map((u) => u.id),
    createdAt: us[0]?.created_at ?? "",
  }))
}

async function count(table: string, filter: string): Promise<number> {
  const res = await fetch(`${supabaseUrl()}/rest/v1/${table}?select=*&${filter}`, {
    method: "HEAD",
    headers: { ...serviceHeaders(), Prefer: "count=exact" },
  })
  if (!res.ok) throw new Error(`E2E HEAD ${table} -> ${res.status}`)
  return Number(res.headers.get("content-range")?.split("/")[1] ?? 0)
}

/** What a run left behind, read-only. Same scope cleanupRun() deletes. */
export async function auditRun(run: LeftoverRun): Promise<Record<string, number>> {
  const uids = inList(run.userIds)
  const owners = await select<{ id: string }>("owners", `created_by=${uids}`, "id")
  const vehicles = owners.length
    ? await select<{ id: string }>("vehicles", `owner_id=${inList(owners.map((o) => o.id))}`, "id")
    : []
  const vids = vehicles.map((v) => v.id)
  const leadFilter = vids.length ? `or=(created_by.${uids},vehicle_id.${inList(vids)})` : `created_by=${uids}`
  const leads = await select<{ id: string; contact_id: string }>("leads", leadFilter, "id,contact_id")
  const lids = leads.map((l) => l.id)
  return {
    "staff accounts": await count("users", `id=${uids}`),
    owners: owners.length,
    vehicles: vids.length,
    leads: lids.length,
    contacts: new Set(leads.map((l) => l.contact_id)).size,
    "follow-ups": lids.length ? await count("follow_ups", `lead_id=${inList(lids)}`) : 0,
    notifications: await count(
      "notifications",
      lids.length ? `or=(entity_id.${inList(lids)},lead_id.${inList(lids)},user_id.${uids})` : `user_id=${uids}`
    ),
    "photos (rows + files)": vids.length ? await count("vehicle_media", `vehicle_id=${inList(vids)}`) : 0,
    documents: vids.length ? await count("vehicle_documents", `vehicle_id=${inList(vids)}`) : 0,
    "audit log entries": await count("audit_logs", `actor_id=${uids}`),
  }
}

/** Removes runs that never reached teardown and are older than maxAgeMinutes. */
export async function sweepStaleRuns(maxAgeMinutes = 60): Promise<string[]> {
  const problems: string[] = []
  for (const run of await findLeftoverRuns(maxAgeMinutes)) {
    problems.push(...(await cleanupRun(run.prefix, run.userIds)))
  }
  return problems
}
