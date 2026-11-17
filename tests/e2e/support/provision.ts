/**
 * Self-contained test-data provisioning for the E2E suite.
 *
 * Creates a per-run admin and salesperson (Supabase service role), one lead
 * (backend API), and resolves the finance key. Every row carries a unique
 * per-run prefix, so parallel runs and shards cannot collide; cleanupRun()
 * removes everything the run's users created.
 *
 * Needs: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, API_BASE_URL (backend).
 * Optional: E2E_FINANCE_KEY (shared vault, e.g. lms_dev). Without it, an
 * uninitialised vault (fresh CI database) is set up and its key used.
 */
import { randomBytes } from "node:crypto"
import { Api, randomPhone, SHOWROOM_ID } from "./api"
import { cleanupRun, rest } from "./db"

export const ADMIN_ROLE_ID = "a0000000-0000-4000-8000-000000000001"
export const SALES_ROLE_ID = "a0000000-0000-4000-8000-000000000002"

export interface RunData {
  prefix: string
  userId: string
  email: string
  password: string
  fullName: string
  salesId: string
  salesEmail: string
  salesPassword: string
  salesName: string
  leadId: string
  contactId: string
  leadName: string
  leadPhone: string
  financeKey: string
}

export async function createStaff(
  prefix: string,
  label: string,
  roleId: string,
  grantedBy?: string
): Promise<{ id: string; email: string; password: string; fullName: string }> {
  const email = `${prefix}-${label}@example.com`
  const password = `Pw-${randomBytes(12).toString("base64url")}`
  const fullName = `E2E ${label} ${prefix}`
  const authUser = await rest<{ id: string }>("POST", "/auth/v1/admin/users", {
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName },
  })
  await rest("POST", "/rest/v1/users", { id: authUser.id, full_name: fullName, email, showroom_id: SHOWROOM_ID })
  await rest("POST", "/rest/v1/user_roles", {
    user_id: authUser.id,
    role_id: roleId,
    granted_by: grantedBy ?? authUser.id,
  })
  return { id: authUser.id, email, password, fullName }
}

export async function provision(): Promise<RunData> {
  const prefix = `e2e-${Date.now().toString(36)}-${randomBytes(3).toString("hex")}`
  const ids: string[] = []
  try {
    const admin = await createStaff(prefix, "admin", ADMIN_ROLE_ID)
    ids.push(admin.id)
    const sales = await createStaff(prefix, "sales", SALES_ROLE_ID, admin.id)
    ids.push(sales.id)

    const api = await Api.login(admin.email, admin.password)
    const leadName = `Lead ${prefix}`
    const leadPhone = randomPhone()
    const lead = await api.createLead(prefix, { fullName: leadName, phone: leadPhone })

    return {
      prefix,
      userId: admin.id,
      email: admin.email,
      password: admin.password,
      fullName: admin.fullName,
      salesId: sales.id,
      salesEmail: sales.email,
      salesPassword: sales.password,
      salesName: sales.fullName,
      leadId: lead.id,
      contactId: lead.contactId,
      leadName,
      leadPhone,
      financeKey: await resolveFinanceKey(api),
    }
  } catch (e) {
    await cleanupRun(prefix, ids)
    throw e
  }
}

async function resolveFinanceKey(api: Api): Promise<string> {
  if (process.env.E2E_FINANCE_KEY) return process.env.E2E_FINANCE_KEY
  const vault = await api.ok<{ initialized: boolean; confirmed: boolean }>("GET", "/finance/vault")
  if (vault.initialized) return "" // finance specs skip without a key
  const { financeKey, recoveryKey } = await api.ok<{ financeKey: string; recoveryKey: string }>(
    "POST",
    "/finance/vault/setup"
  )
  await api.ok("POST", "/finance/vault/confirm", { recoveryKey })
  return financeKey
}

export function cleanup(data: Pick<RunData, "prefix" | "userId" | "salesId">): Promise<string[]> {
  return cleanupRun(data.prefix, [data.userId, data.salesId])
}
