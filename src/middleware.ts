import { auth } from "@/lib/auth"
import { NextResponse } from "next/server"

export default auth((req) => {
  const session = req.auth
  const { pathname } = req.nextUrl

  const isAuthPath = pathname.startsWith("/login")

  if (!session && !isAuthPath) {
    return NextResponse.redirect(new URL("/login", req.url))
  }

  if (session?.error === "RefreshTokenError" && !isAuthPath) {
    return NextResponse.redirect(new URL("/login?error=SessionExpired", req.url))
  }

  if (session && !session.error && isAuthPath) {
    return NextResponse.redirect(new URL("/dashboard", req.url))
  }
})

export const config = {
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico).*)"],
}
