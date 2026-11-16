/**
 * Self-contained test-data provisioning for the E2E suite.
 *
 * Talks to Supabase (service role) to create a staff login and to the backend
 * API to create a lead, so tests never depend on pre-existing rows. Every row
 * carries a unique per-run prefix so parallel runs and shards cannot collide.
 *
 * Needs: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, API_BASE_URL (backend).
 */
import { randomBytes, randomInt } from "node:crypto"

const ADMIN_ROLE_ID = "a0000000-0000-4000-8000-000000000001"
const SHOWROOM_ID = "b0000000-0000-4000-8000-000000000001"

export interface RunData {
  prefix: string
  userId: string
  email: string
  password: string
  fullName: string
  leadId: string
  contactId: string
  leadName: string
  leadPhone: string
}

function requireEnv(name: string): string {
  const value = process.env[name]
  if (!value) throw new Error(`E2E: missing required env var ${name}`)
  return value
}

const supabaseUrl = () => requireEnv("SUPABASE_URL").replace(/\/$/, "")
const apiUrl = () => requireEnv("API_BASE_URL").replace(/\/$/, "")

function serviceHeaders(): Record<string, string> {
  const key = requireEnv("SUPABASE_SERVICE_ROLE_KEY")
  return {
    apikey: key,
    Authorization: `Bearer ${key}`,
    "Content-Type": "application/json",
  }
}

async function rest(
  method: string,
  path: string,
  body?: unknown,
  ok: readonly number[] = [200, 201, 204]
): Promise<unknown> {
  const res = await fetch(`${supabaseUrl()}${path}`, {
    method,
    headers: { ...serviceHeaders(), Prefer: "return=representation" },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  if (!ok.includes(res.status)) {
    throw new Error(`E2E ${method} ${path} -> ${res.status} ${await res.text()}`)
  }
  const text = await res.text()
  return text ? JSON.parse(text) : null
}

export async function provision(): Promise<RunData> {
  const partial: Partial<RunData> = {}
  try {
    return await provisionInner(partial)
  } catch (e) {
    await cleanup(partial)
    throw e
  }
}

async function provisionInner(partial: Partial<RunData>): Promise<RunData> {
  const prefix = `e2e-${Date.now().toString(36)}-${randomBytes(3).toString("hex")}`
  const email = `${prefix}@example.com`
  const password = `Pw-${randomBytes(12).toString("base64url")}`
  const fullName = `E2E Admin ${prefix}`

  const authUser = (await rest("POST", "/auth/v1/admin/users", {
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName },
  })) as { id: string }
  const userId = authUser.id
  partial.userId = userId

  await rest("POST", "/rest/v1/users", {
    id: userId,
    full_name: fullName,
    email,
    showroom_id: SHOWROOM_ID,
  })
  await rest("POST", "/rest/v1/user_roles", {
    user_id: userId,
    role_id: ADMIN_ROLE_ID,
    granted_by: userId,
  })

  const loginRes = await fetch(`${apiUrl()}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  })
  if (!loginRes.ok) {
    throw new Error(`E2E backend login failed: ${loginRes.status} ${await loginRes.text()}`)
  }
  const { accessToken } = (await loginRes.json()) as { accessToken: string }

  const leadName = `Lead ${prefix}`
  const leadPhone = `+9199${String(randomInt(0, 100_000_000)).padStart(8, "0")}`
  const leadRes = await fetch(`${apiUrl()}/leads`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      fullName: leadName,
      phone: leadPhone,
      source: "phone",
      budget: 800000,
    }),
  })
  if (leadRes.status !== 201) {
    throw new Error(`E2E create lead failed: ${leadRes.status} ${await leadRes.text()}`)
  }
  const lead = (await leadRes.json()) as { id: string; contactId: string }
  partial.leadId = lead.id
  partial.contactId = lead.contactId

  return {
    prefix,
    userId,
    email,
    password,
    fullName,
    leadId: lead.id,
    contactId: lead.contactId,
    leadName,
    leadPhone,
  }
}

/** Hard-deletes everything provisioned for a run. Best effort, never throws. */
export async function cleanup(data: Partial<RunData> | undefined): Promise<string[]> {
  if (!data) return []
  const problems: string[] = []
  const attempt = async (label: string, fn: () => Promise<unknown>) => {
    try {
      await fn()
    } catch (e) {
      problems.push(`${label}: ${(e as Error).message}`)
    }
  }
  const uid = data.userId
  if (!uid) return problems
  await attempt("notifications", () => rest("DELETE", `/rest/v1/notifications?user_id=eq.${uid}`))
  if (data.leadId) {
    const leadFilter = `lead_id=eq.${data.leadId}`
    await attempt("follow_ups", () => rest("DELETE", `/rest/v1/follow_ups?${leadFilter}`))
    await attempt("lead_status_history", () =>
      rest("DELETE", `/rest/v1/lead_status_history?${leadFilter}`)
    )
    await attempt("lead", () => rest("DELETE", `/rest/v1/leads?id=eq.${data.leadId}`))
  }
  if (data.contactId) {
    await attempt("contact", () => rest("DELETE", `/rest/v1/contacts?id=eq.${data.contactId}`))
  }
  await attempt("audit_logs", () => rest("DELETE", `/rest/v1/audit_logs?actor_id=eq.${uid}`))
  await attempt("user_roles", () => rest("DELETE", `/rest/v1/user_roles?user_id=eq.${uid}`))
  await attempt("users", () => rest("DELETE", `/rest/v1/users?id=eq.${uid}`))
  await attempt("auth user", () => rest("DELETE", `/auth/v1/admin/users/${uid}`))
  return problems
}
