import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { UserCog } from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { getShowrooms } from "@/features/finance/api"
import { getUsers } from "@/features/users/api"
import { CreateStaffSheet } from "@/features/users/components/create-staff-sheet"
import { StaffList } from "@/features/users/components/staff-list"
import { auth } from "@/lib/auth"

export const metadata: Metadata = { title: "Staff" }

/** Showrooms are small: one page of active staff covers them. */
const STAFF_LIMIT = 100

export default async function StaffPage() {
  const session = await auth()
  if (!session?.user?.roles?.includes("admin")) redirect("/leads")

  const [page, showrooms] = await Promise.all([getUsers({ limit: STAFF_LIMIT }), getShowrooms()])
  const staff = [...page.items].sort((a, b) => a.fullName.localeCompare(b.fullName))

  return (
    <div className="space-y-5">
      <PageHeader
        title="Staff"
        subtitle={
          <>
            {page.total} active {page.total === 1 ? "account" : "accounts"}
            {page.total > staff.length ? ` (showing ${staff.length})` : ""}
          </>
        }
        action={<CreateStaffSheet showrooms={showrooms} />}
      />

      {staff.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-border bg-card py-16 text-center">
          <div className="mb-1 flex size-10 items-center justify-center rounded-full bg-accent">
            <UserCog className="size-5 text-primary" />
          </div>
          <p className="text-sm font-semibold text-foreground">No staff yet</p>
          <p className="text-xs text-subtle-foreground">Add a salesperson to get started.</p>
        </div>
      ) : (
        <StaffList staff={staff} showrooms={showrooms} currentUserId={session.user.id} />
      )}
    </div>
  )
}
