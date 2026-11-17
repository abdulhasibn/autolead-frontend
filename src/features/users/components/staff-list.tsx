import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { formatDate } from "@/lib/format"
import type { StaffMemberDto } from "../types"
import { DeactivateStaffDialog } from "./deactivate-staff-dialog"
import { EditStaffSheet } from "./edit-staff-sheet"
import { ROLE_LABELS } from "../constants"

const HEAD = "h-10 px-4 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground"
const CELL = "px-4 py-3"
const EMPTY = <span className="text-subtle-foreground">—</span>

type Showroom = { id: string; name: string }

interface StaffListProps {
  staff: StaffMemberDto[]
  showrooms: Showroom[]
  currentUserId: string
}

function Roles({ roles }: { roles: StaffMemberDto["roles"] }) {
  return (
    <span className="flex flex-wrap gap-1">
      {roles.map((role) => (
        <Badge key={role} variant={role === "admin" ? "default" : "secondary"}>
          {ROLE_LABELS[role]}
        </Badge>
      ))}
    </span>
  )
}

function Avatar({ name }: { name: string }) {
  return (
    <span
      aria-hidden
      className="flex size-8 shrink-0 items-center justify-center rounded-full border border-primary/20 bg-accent text-xs font-semibold text-primary"
    >
      {name.charAt(0).toUpperCase()}
    </span>
  )
}

function Actions({ user, showrooms, isSelf }: { user: StaffMemberDto; showrooms: Showroom[]; isSelf: boolean }) {
  return (
    <div className="flex flex-wrap justify-end gap-2">
      <EditStaffSheet user={user} showrooms={showrooms} />
      {/* The API refuses deactivating yourself; don't offer it. */}
      {!isSelf && <DeactivateStaffDialog userId={user.id} fullName={user.fullName} />}
    </div>
  )
}

/** Active staff: a table on desktop, cards on phones. */
export function StaffList({ staff, showrooms, currentUserId }: StaffListProps) {
  const showroomName = (id: string | null) =>
    id === null ? null : (showrooms.find((s) => s.id === id)?.name ?? "Unknown showroom")

  return (
    <>
      <div className="hidden overflow-hidden rounded-xl border border-border bg-card md:block">
        <Table>
          <TableHeader className="bg-card/50">
            <TableRow className="border-border/50 hover:bg-transparent">
              <TableHead className={HEAD}>Name</TableHead>
              <TableHead className={HEAD}>Roles</TableHead>
              <TableHead className={HEAD}>Contact</TableHead>
              <TableHead className={HEAD}>Showroom</TableHead>
              <TableHead className={HEAD}>Added</TableHead>
              <TableHead className={HEAD}>
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {staff.map((user) => (
              <TableRow key={user.id} className="border-border/50 hover:bg-card/50">
                <TableCell className={CELL}>
                  <div className="flex items-center gap-3">
                    <Avatar name={user.fullName} />
                    <span className="text-sm font-medium text-foreground">
                      {user.fullName}
                      {user.id === currentUserId && (
                        <span className="ml-1.5 text-xs font-normal text-muted-foreground">(you)</span>
                      )}
                    </span>
                  </div>
                </TableCell>
                <TableCell className={CELL}>
                  <Roles roles={user.roles} />
                </TableCell>
                <TableCell className={`${CELL} text-sm`}>
                  <div>{user.email ?? EMPTY}</div>
                  <div className="text-muted-foreground">{user.phone}</div>
                </TableCell>
                <TableCell className={`${CELL} text-sm`}>{showroomName(user.showroomId) ?? EMPTY}</TableCell>
                <TableCell className={`${CELL} text-sm text-muted-foreground`}>{formatDate(user.createdAt)}</TableCell>
                <TableCell className={CELL}>
                  <Actions user={user} showrooms={showrooms} isSelf={user.id === currentUserId} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <ul className="space-y-3 md:hidden">
        {staff.map((user) => (
          <li key={user.id} className="space-y-3 rounded-xl border border-border bg-card p-4">
            <div className="flex items-start gap-3">
              <Avatar name={user.fullName} />
              <div className="min-w-0 flex-1 space-y-1">
                <p className="text-sm font-medium break-words">
                  {user.fullName}
                  {user.id === currentUserId && (
                    <span className="ml-1.5 text-xs font-normal text-muted-foreground">(you)</span>
                  )}
                </p>
                <Roles roles={user.roles} />
                <p className="text-xs break-words text-muted-foreground">
                  {[user.email, user.phone, showroomName(user.showroomId)].filter(Boolean).join(" · ")}
                </p>
              </div>
            </div>
            <Actions user={user} showrooms={showrooms} isSelf={user.id === currentUserId} />
          </li>
        ))}
      </ul>
    </>
  )
}
