import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { z } from "zod"
import { env } from "@/lib/env"
import type { UserRole } from "@/types/auth"

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

async function refreshAccessToken(refreshToken: string) {
  const res = await fetch(`${env.API_BASE_URL}/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken }),
  })
  if (!res.ok) throw new Error("RefreshTokenError")
  return (await res.json()) as { accessToken: string; refreshToken: string }
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

        const { accessToken, refreshToken } = (await res.json()) as {
          accessToken: string
          refreshToken: string
        }

        // Fetch the user profile using the new token
        const meRes = await fetch(`${env.API_BASE_URL}/auth/me`, {
          headers: { Authorization: `Bearer ${accessToken}` },
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
          accessToken,
          refreshToken,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      // Initial sign in — persist tokens and roles
      if (user) {
        token.accessToken = user.accessToken
        token.refreshToken = user.refreshToken
        token.roles = user.roles
        return token
      }

      // Subsequent calls — attempt token refresh if error flag is set
      if (token.error === "RefreshTokenError") return token

      try {
        const refreshed = await refreshAccessToken(token.refreshToken)
        return {
          ...token,
          accessToken: refreshed.accessToken,
          refreshToken: refreshed.refreshToken,
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
