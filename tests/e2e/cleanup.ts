/**
 * Finds and removes data left in the dev database by E2E runs that never
 * reached teardown (interrupted, crashed, or copied by a dump mid-run).
 *
 *   pnpm test:e2e:cleanup                       # dry run: list leftover runs and what they hold
 *   pnpm test:e2e:cleanup --apply               # delete every leftover run
 *   pnpm test:e2e:cleanup --apply --older-than 60
 *   pnpm test:e2e:cleanup --apply --prefix e2e-mws0fybp-81262e
 *
 * Only rows tied to a run's own `<prefix>-<label>@example.com` staff users are
 * touched (the same scope teardown deletes), plus those rows' storage files.
 * Real users' data is never selected. Refuses to run against production.
 * Uses SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (see support/env.ts).
 */
import { auditRun, cleanupRun, findLeftoverRuns, type LeftoverRun } from "./support/db"
import { assertNotProd, loadLocalEnv } from "./support/env"

function arg(name: string): string | undefined {
  const i = process.argv.indexOf(name)
  return i === -1 ? undefined : process.argv[i + 1]
}

function print(run: LeftoverRun, counts: Record<string, number>) {
  console.log(`\n${run.prefix}  (started ${run.createdAt.slice(0, 16).replace("T", " ")} UTC)`)
  for (const [k, v] of Object.entries(counts)) if (v) console.log(`  ${k.padEnd(24)} ${v}`)
}

const total = (c: Record<string, number>) => Object.values(c).reduce((a, b) => a + b, 0)

async function main() {
  loadLocalEnv()
  assertNotProd()
  const apply = process.argv.includes("--apply")
  const olderThan = Number(arg("--older-than") ?? 0)
  const only = arg("--prefix")

  const host = new URL(process.env.SUPABASE_URL ?? "").host
  console.log(`Database: ${host}`)
  const runs = (await findLeftoverRuns(olderThan)).filter((r) => !only || r.prefix === only)
  if (!runs.length) {
    console.log("No leftover E2E runs. Nothing to do.")
    return
  }

  for (const run of runs) print(run, await auditRun(run))
  if (!apply) {
    console.log(`\nDry run: ${runs.length} leftover run(s). Re-run with --apply to delete them.`)
    return
  }

  let failed = false
  for (const run of runs) {
    const problems = await cleanupRun(run.prefix, run.userIds)
    const residue = await auditRun(run).catch(() => null)
    // Staff users are deleted last; if they're gone, re-auditing by them finds nothing.
    const left = residue ? total(residue) : 0
    if (problems.length || left) {
      failed = true
      console.error(`\n${run.prefix}: not fully removed`)
      for (const p of problems) console.error(`  - ${p}`)
      if (residue) print(run, residue)
    } else {
      console.log(`\n${run.prefix}: removed`)
    }
  }
  const after = await findLeftoverRuns(olderThan)
  console.log(`\nLeftover E2E runs now: ${after.filter((r) => !only || r.prefix === only).length}`)
  if (failed) process.exit(1)
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e)
  process.exit(1)
})
