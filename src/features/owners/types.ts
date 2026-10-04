export type PreferredContactMethod = "phone" | "email" | "whatsapp"

export interface OwnerDto {
  id: string
  userId: string | null
  fullName: string
  phone: string
  email: string | null
  address: string | null
  city: string | null
  preferredContactMethod: PreferredContactMethod | null
  altPhone: string | null
  idInfo: string | null
  notes: string | null
  createdBy: string | null
  createdAt: string
  updatedAt: string
}
