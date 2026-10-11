import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { z } from "zod"
import { env } from "@/lib/env"
import type { UserRole } from "@/types/auth"

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

// How long before expiry we proactively refresh (60 seconds)
const REFRESH_BUFFER_MS = 60_000
// Default access token lifespan when the API doesn't return expiresIn
const DEFAULT_TOKEN_TTL_MS = 15 * 60 * 1000

async function refreshAccessToken(refreshToken: string) {
  const res = await fetch(`${env.API_BASE_URL}/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken }),
  })
  if (!res.ok) throw new Error("RefreshTokenError")
  const data = (await res.json()) as {
    accessToken: string
    refreshToken: string
    expiresIn?: number
  }

  const meRes = await fetch(`${env.API_BASE_URL}/auth/me`, {
    headers: { Authorization: `Bearer ${data.accessToken}` },
  })
  const fullName = meRes.ok ? ((await meRes.json()) as { fullName: string }).fullName : undefined

  return {
    accessToken: data.accessToken,
    refreshToken: data.refreshToken,
    accessTokenExpiresAt: Date.now() + (data.expiresIn ? data.expiresIn * 1000 : DEFAULT_TOKEN_TTL_MS),
    fullName,
  }
}

export const { auth, handlers, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const parsed = credentialsSchema.safeParse(credentials)
        if (!parsed.success) return null

        const res = await fetch(`${env.API_BASE_URL}/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(parsed.data),
        })

        if (!res.ok) return null

        const data = (await res.json()) as {
          accessToken: string
          refreshToken: string
          expiresIn?: number
        }

        const meRes = await fetch(`${env.API_BASE_URL}/auth/me`, {
          headers: { Authorization: `Bearer ${data.accessToken}` },
        })
        if (!meRes.ok) return null

        const me = (await meRes.json()) as {
          id: string
          fullName: string
          email: string | null
          phone: string | null
          avatarUrl: string | null
          roles: UserRole[]
        }

        return {
          id: me.id,
          name: me.fullName,
          email: me.email ?? undefined,
          phone: me.phone,
          avatarUrl: me.avatarUrl,
          roles: me.roles,
          accessToken: data.accessToken,
          refreshToken: data.refreshToken,
          accessTokenExpiresAt: Date.now() + (data.expiresIn ? data.expiresIn * 1000 : DEFAULT_TOKEN_TTL_MS),
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      // Initial sign in — store everything from the user object
      if (user) {
        return {
          ...token,
          accessToken: user.accessToken,
          refreshToken: user.refreshToken,
          accessTokenExpiresAt: user.accessTokenExpiresAt,
          phone: user.phone,
          avatarUrl: user.avatarUrl,
          roles: user.roles,
          error: undefined,
        }
      }

      // Token refresh previously failed — don't retry, force re-login
      if (token.error === "RefreshTokenError") return token

      // Access token still valid — return as-is
      if (Date.now() < token.accessTokenExpiresAt - REFRESH_BUFFER_MS) return token

      // Access token expired or close to expiry — refresh it
      try {
        const refreshed = await refreshAccessToken(token.refreshToken)
        return {
          ...token,
          accessToken: refreshed.accessToken,
          refreshToken: refreshed.refreshToken,
          accessTokenExpiresAt: refreshed.accessTokenExpiresAt,
          ...(refreshed.fullName ? { name: refreshed.fullName } : {}),
          error: undefined,
        }
      } catch {
        return { ...token, error: "RefreshTokenError" as const }
      }
    },

    async session({ session, token }) {
      session.accessToken = token.accessToken
      session.error = token.error
      session.user.id = token.sub ?? ""
      session.user.phone = token.phone
      session.user.avatarUrl = token.avatarUrl
      session.user.roles = token.roles ?? []
      return session
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  session: { strategy: "jwt" },
})
