export type StaffRole = "admin" | "salesperson"

export interface StaffMemberDto {
  id: string
  fullName: string
  phone: string
  email: string | null
  showroomId: string | null
  roles: StaffRole[]
  createdAt: string
}
