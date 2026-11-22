/**
 * Every E2E run tags what it creates with a prefix `e2e-<time36>-<hex6>`.
 * Its staff accounts are `<prefix>-<label>@example.com` (admin, sales, u01, …).
 */
const RUN_EMAIL = /^(e2e-[a-z0-9]+-[0-9a-f]{6})-[a-z0-9]+@example\.com$/i

/** The run prefix of an E2E staff email, or null for any other address. */
export function runPrefix(email: string): string | null {
  return RUN_EMAIL.exec(email)?.[1]?.toLowerCase() ?? null
}

/** Groups E2E staff users by run; other users are ignored. */
export function groupByRun<T extends { email: string }>(users: T[]): Map<string, T[]> {
  const runs = new Map<string, T[]>()
  for (const u of users) {
    const prefix = runPrefix(u.email)
    if (prefix) runs.set(prefix, [...(runs.get(prefix) ?? []), u])
  }
  return runs
}
