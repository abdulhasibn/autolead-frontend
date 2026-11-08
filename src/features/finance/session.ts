import { cookies } from "next/headers"

/**
 * The finance session token lives only in this httpOnly cookie. Client JS
 * never sees it, and it is never put in the next-auth session, a URL or a log.
 */
export const FINANCE_COOKIE = "af_fin"

/** The backend's hard limit on a finance session. */
export const FINANCE_COOKIE_MAX_AGE = 8 * 60 * 60

export function financeCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict" as const,
    path: "/",
    maxAge: FINANCE_COOKIE_MAX_AGE,
  }
}

export async function getFinanceToken(): Promise<string | null> {
  const store = await cookies()
  return store.get(FINANCE_COOKIE)?.value || null
}

export async function hasFinanceSession(): Promise<boolean> {
  return (await getFinanceToken()) !== null
}

/** Server Functions / Route Handlers only: cookies can't be written during render. */
export async function setFinanceSession(token: string): Promise<void> {
  const store = await cookies()
  store.set(FINANCE_COOKIE, token, financeCookieOptions())
}

/** Server Functions / Route Handlers only. Throws during Server Component render. */
export async function clearFinanceSession(): Promise<void> {
  const store = await cookies()
  store.delete({ name: FINANCE_COOKIE, path: "/" })
}

/**
 * Keeps a `?next=` target on this site: a single leading slash, no scheme or
 * protocol-relative tricks. Anything else falls back to /finance.
 */
export function safeNextPath(value: string | null | undefined, fallback = "/finance"): string {
  if (!value) return fallback
  if (!value.startsWith("/") || value.startsWith("//") || value.startsWith("/\\")) return fallback
  if (/[\r\n]/.test(value)) return fallback
  // Never bounce back into the vault screens or the clearing route itself.
  if (value.startsWith("/api/") || value.startsWith("/finance/unlock")) return fallback
  return value
}
