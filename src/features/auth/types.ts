import type { LoginInput } from "./schemas"

export type { LoginInput }

export interface UserProfileDto {
  id: string
  fullName: string
  phone: string | null
  email: string | null
  avatarUrl: string | null
  roles: ("admin" | "salesperson")[]
}
