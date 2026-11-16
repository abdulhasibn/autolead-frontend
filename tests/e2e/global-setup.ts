import { cleanup, provision, type RunData } from "./support/provision"

/**
 * Creates a per-run admin login and one lead, exposes them to workers through
 * env vars, and removes them again in teardown. Each shard provisions its own
 * data (unique prefix), so shards never share rows.
 */
export default async function globalSetup() {
  const data: RunData = await provision()
  process.env.E2E_USER_EMAIL = data.email
  process.env.E2E_USER_PASSWORD = data.password
  process.env.E2E_USER_NAME = data.fullName
  process.env.E2E_LEAD_ID = data.leadId
  process.env.E2E_LEAD_NAME = data.leadName
  process.env.E2E_LEAD_PHONE = data.leadPhone

  return async () => {
    const problems = await cleanup(data)
    if (problems.length) {
      console.warn(`E2E cleanup left residue for ${data.prefix}:\n${problems.join("\n")}`)
    }
  }
}
