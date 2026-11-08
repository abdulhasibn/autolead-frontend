import { NextResponse, type NextRequest } from "next/server"
import { FINANCE_COOKIE, safeNextPath } from "@/features/finance/session"

/**
 * A 423 during Server Component render lands here: render can't delete
 * cookies, a route handler can. Drops the stale finance cookie and sends the
 * admin to unlock with a same-site back-link.
 */
export function GET(req: NextRequest) {
  const next = safeNextPath(req.nextUrl.searchParams.get("next"))
  const url = new URL("/finance/unlock", req.url)
  url.searchParams.set("next", next)
  const res = NextResponse.redirect(url)
  res.cookies.delete({ name: FINANCE_COOKIE, path: "/" })
  res.headers.set("Cache-Control", "no-store")
  return res
}
