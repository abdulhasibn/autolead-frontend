import { auth } from "@/lib/auth"
import { NextResponse } from "next/server"

const PUBLIC_PATHS = ["/login"]

export default auth((req) => {
  const { pathname } = req.nextUrl
  const session = req.auth

  const isLoggedIn = !!session
  const hasRefreshError = session?.error === "RefreshTokenError"
  const isAuthPage = PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`))

  // Refresh failed — clear session and send to login
  if (hasRefreshError && !isAuthPage) {
    const loginUrl = new URL("/login", req.url)
    loginUrl.searchParams.set("error", "SessionExpired")
    return NextResponse.redirect(loginUrl)
  }

  // Unauthenticated user trying to access a protected route
  if (!isLoggedIn && !isAuthPage) {
    const loginUrl = new URL("/login", req.url)
    loginUrl.searchParams.set("callbackUrl", pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Authenticated user hitting the login page — send to dashboard
  if (isLoggedIn && !hasRefreshError && isAuthPage) {
    return NextResponse.redirect(new URL("/dashboard", req.url))
  }

  return NextResponse.next()
})

export const config = {
  matcher: [
    /*
     * Match all paths except:
     * - api (NextAuth session/csrf must not re-enter this proxy)
     * - _next/static, _next/image
     * - favicon.ico, sitemap.xml, robots.txt
     * - public image assets
     */
    "/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|.*\\.(?:png|jpg|jpeg|gif|svg|ico|webp)$).*)",
  ],
}
