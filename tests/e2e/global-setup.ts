import { mkdirSync } from "node:fs"
import path from "node:path"
import { assertNotProd, loadLocalEnv } from "./support/env"
import { cleanup, provision, type RunData } from "./support/provision"

/**
 * Creates a per-run admin, salesperson and lead, exposes them to workers
 * through env vars, and removes everything the run created in teardown.
 * Each shard provisions its own data (unique prefix), so shards never share rows.
 */
export default async function globalSetup() {
  loadLocalEnv()
  assertNotProd()
  mkdirSync(path.resolve(__dirname, "../../test-results"), { recursive: true })

  const data: RunData = await provision()
  const env: Record<string, string> = {
    E2E_PREFIX: data.prefix,
    E2E_USER_ID: data.userId,
    E2E_USER_EMAIL: data.email,
    E2E_USER_PASSWORD: data.password,
    E2E_USER_NAME: data.fullName,
    E2E_SALES_ID: data.salesId,
    E2E_SALES_EMAIL: data.salesEmail,
    E2E_SALES_PASSWORD: data.salesPassword,
    E2E_SALES_NAME: data.salesName,
    E2E_LEAD_ID: data.leadId,
    E2E_LEAD_NAME: data.leadName,
    E2E_LEAD_PHONE: data.leadPhone,
    E2E_FINANCE_KEY: data.financeKey,
  }
  Object.assign(process.env, env)

  return async () => {
    if (process.env.E2E_KEEP_DATA) return
    const problems = await cleanup(data)
    if (problems.length) {
      console.warn(`E2E cleanup left residue for ${data.prefix}:\n${problems.join("\n")}`)
    }
  }
}
