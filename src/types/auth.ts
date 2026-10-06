import type { DefaultSession } from "next-auth"
import type { DefaultJWT } from "next-auth/jwt"

export type UserRole = "admin" | "salesperson"

declare module "next-auth" {
  interface Session extends DefaultSession {
    accessToken: string
    error?: "RefreshTokenError"
    user: DefaultSession["user"] & {
      id: string
      phone: string | null
      avatarUrl: string | null
      roles: UserRole[]
    }
  }

  interface User {
    id: string
    name?: string | null
    email?: string | null
    image?: string | null
    phone: string | null
    avatarUrl: string | null
    accessToken: string
    refreshToken: string
    accessTokenExpiresAt: number
    roles: UserRole[]
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    accessToken: string
    refreshToken: string
    accessTokenExpiresAt: number
    phone: string | null
    avatarUrl: string | null
    roles: UserRole[]
    error?: "RefreshTokenError"
  }
}
