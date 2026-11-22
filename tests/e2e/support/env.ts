/**
 * Local convenience: fill missing E2E env vars from the sibling repos' env
 * files so `pnpm test:e2e` works without exporting anything. CI sets every
 * variable explicitly, so nothing here runs there.
 *
 * Sources (first one wins, already-set vars are never overwritten):
 * - tests/e2e/.env.e2e.local (gitignored; E2E_FINANCE_KEY and overrides)
 * - ../autoLeadBackend/.env   (SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
 * - .env.local                (API_BASE_URL)
 */
import { existsSync, readFileSync } from "node:fs"
import path from "node:path"

const ROOT = path.resolve(__dirname, "../../..")

function parse(file: string): Record<string, string> {
  if (!existsSync(file)) return {}
  const out: Record<string, string> = {}
  for (const line of readFileSync(file, "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/)
    if (m?.[1] && m[2] !== undefined) out[m[1]] = m[2].replace(/^["']|["']$/g, "")
  }
  return out
}

export function loadLocalEnv(): void {
  if (process.env.CI) return
  const sources = [
    parse(path.join(ROOT, "tests/e2e/.env.e2e.local")),
    pick(parse(path.join(ROOT, "../autoLeadBackend/.env")), [
      "SUPABASE_URL",
      "SUPABASE_SERVICE_ROLE_KEY",
    ]),
    pick(parse(path.join(ROOT, ".env.local")), ["API_BASE_URL"]),
  ]
  for (const src of sources) {
    for (const [k, v] of Object.entries(src)) {
      // A var that is set, even to "", wins. globalSetup sets E2E_FINANCE_KEY=""
      // to mean "skip finance"; workers re-run this file and must not refill it.
      if (process.env[k] === undefined && v) process.env[k] = v
    }
  }
}

function pick(src: Record<string, string>, keys: string[]): Record<string, string> {
  const out: Record<string, string> = {}
  for (const k of keys) {
    const v = src[k]
    if (v) out[k] = v
  }
  return out
}

/** Safety: refuse to run against the production Supabase project. */
export function assertNotProd(): void {
  const url = process.env.SUPABASE_URL ?? ""
  if (url.includes("tvfizfkunkcamrphrknc")) {
    throw new Error("E2E: SUPABASE_URL points at production (lms_prod). Refusing to run.")
  }
}
